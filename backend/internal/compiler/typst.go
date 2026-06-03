package compiler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	PdflatexBinary string
	PdftoppmBinary string
	TemplatesDir   string
	TempDir        string
	Timeout        time.Duration
	MaxFileSize    int64
}

func DefaultConfig() Config {
	return Config{
		PdflatexBinary: "pdflatex",
		PdftoppmBinary: "pdftoppm",
		TemplatesDir:   "./templates",
		TempDir:        os.TempDir(),
		Timeout:        30 * time.Second,
		MaxFileSize:    512 * 1024,
	}
}

type Compiler struct {
	cfg Config
}

func New(cfg Config) (*Compiler, error) {
	if _, err := exec.LookPath(cfg.PdflatexBinary); err != nil {
		return nil, fmt.Errorf("pdflatex not found at %q: %w", cfg.PdflatexBinary, err)
	}
	if _, err := os.Stat(cfg.TemplatesDir); err != nil {
		return nil, fmt.Errorf("templates dir not found at %q: %w", cfg.TemplatesDir, err)
	}
	return &Compiler{cfg: cfg}, nil
}

type CompileResult struct {
	PDF      []byte
	Warnings []string
}

type PreviewResult struct {
	Pages [][]byte
}

func randomID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// CompilePDF compiles LaTeX source → PDF via pdflatex (2 passes).
func (c *Compiler) CompilePDF(ctx context.Context, source string) (*CompileResult, error) {
	if int64(len(source)) > c.cfg.MaxFileSize {
		return nil, fmt.Errorf("source too large: %d bytes (max %d)", len(source), c.cfg.MaxFileSize)
	}

	workDir, err := c.createWorkDir()
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(workDir)

	texPath := filepath.Join(workDir, "cv.tex")
	if err := os.WriteFile(texPath, []byte(source), 0600); err != nil {
		return nil, fmt.Errorf("failed to write source: %w", err)
	}

	// Run pdflatex twice (for references, toc, etc.)
	for pass := 1; pass <= 2; pass++ {
		if err := c.runPdflatex(ctx, workDir, texPath); err != nil {
			if pass == 2 {
				return nil, err
			}
			// First pass errors are often OK (missing refs), continue
		}
	}

	pdfPath := filepath.Join(workDir, "cv.pdf")
	pdf, err := os.ReadFile(pdfPath)
	if err != nil {
		return nil, fmt.Errorf("pdflatex produced no output — check your LaTeX code")
	}

	// Extract warnings from log
	var warnings []string
	logData, _ := os.ReadFile(filepath.Join(workDir, "cv.log"))
	if logData != nil {
		for _, line := range strings.Split(string(logData), "\n") {
			if strings.Contains(line, "Warning") && !strings.Contains(line, "Font shape") {
				warnings = append(warnings, strings.TrimSpace(line))
			}
		}
	}

	return &CompileResult{PDF: pdf, Warnings: warnings}, nil
}

// CompilePreview compiles LaTeX → PDF → PNG pages via pdftoppm.
func (c *Compiler) CompilePreview(ctx context.Context, source string, ppi int) (*PreviewResult, error) {
	// First compile to PDF
	result, err := c.CompilePDF(ctx, source)
	if err != nil {
		return nil, err
	}

	if ppi <= 0 || ppi > 600 {
		ppi = 150
	}

	// Write PDF to temp, convert to PNG
	workDir, err := c.createWorkDir()
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(workDir)

	pdfPath := filepath.Join(workDir, "cv.pdf")
	if err := os.WriteFile(pdfPath, result.PDF, 0600); err != nil {
		return nil, fmt.Errorf("failed to write PDF for preview: %w", err)
	}

	// pdftoppm -png -r <ppi> cv.pdf cv-page
	outPrefix := filepath.Join(workDir, "page")
	timeoutCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(timeoutCtx, c.cfg.PdftoppmBinary,
		"-png", "-r", fmt.Sprintf("%d", ppi), pdfPath, outPrefix)
	cmd.Dir = workDir

	if output, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("pdftoppm failed: %s\n%s", err, string(output))
	}

	// Collect pages: page-1.png, page-2.png, ...
	// pdftoppm names them as page-01.png or page-1.png depending on page count
	var pages [][]byte
	for i := 1; i <= 20; i++ {
		for _, pattern := range []string{
			filepath.Join(workDir, fmt.Sprintf("page-%d.png", i)),
			filepath.Join(workDir, fmt.Sprintf("page-%02d.png", i)),
			filepath.Join(workDir, fmt.Sprintf("page-%03d.png", i)),
		} {
			data, err := os.ReadFile(pattern)
			if err == nil {
				pages = append(pages, data)
				break
			}
		}
		if len(pages) < i {
			break // no more pages
		}
	}

	if len(pages) == 0 {
		return nil, fmt.Errorf("preview produced no pages")
	}

	return &PreviewResult{Pages: pages}, nil
}

func (c *Compiler) runPdflatex(ctx context.Context, workDir, texPath string) error {
	timeoutCtx, cancel := context.WithTimeout(ctx, c.cfg.Timeout)
	defer cancel()

	cmd := exec.CommandContext(timeoutCtx, c.cfg.PdflatexBinary,
		"-interaction=nonstopmode",
		"-halt-on-error",
		"-no-shell-escape",
		"-output-directory="+workDir,
		texPath,
	)
	cmd.Dir = workDir
	cmd.Env = append(os.Environ(), "TEXMFVAR="+workDir)

	output, err := cmd.CombinedOutput()
	if err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return fmt.Errorf("compilation timed out after %v", c.cfg.Timeout)
		}
		// Extract meaningful error from log
		errMsg := extractLatexError(string(output))
		return fmt.Errorf("pdflatex error: %s", errMsg)
	}
	return nil
}

func extractLatexError(log string) string {
	var errors []string
	for _, line := range strings.Split(log, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "!") {
			errors = append(errors, line)
		}
	}
	if len(errors) > 0 {
		return strings.Join(errors, "\n")
	}
	// Return last 5 lines as fallback
	lines := strings.Split(strings.TrimSpace(log), "\n")
	if len(lines) > 5 {
		lines = lines[len(lines)-5:]
	}
	return strings.Join(lines, "\n")
}

func (c *Compiler) createWorkDir() (string, error) {
	id := randomID()
	dir := filepath.Join(c.cfg.TempDir, "oneseccv-"+id)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", fmt.Errorf("failed to create work dir: %w", err)
	}
	return dir, nil
}

func (c *Compiler) ListTemplates() ([]string, error) {
	entries, err := os.ReadDir(c.cfg.TemplatesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read templates dir: %w", err)
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".tex") {
			names = append(names, strings.TrimSuffix(e.Name(), ".tex"))
		}
	}
	return names, nil
}

func (c *Compiler) GetTemplate(name string) (string, error) {
	clean := filepath.Base(name)
	if clean != name || strings.Contains(name, "..") {
		return "", fmt.Errorf("invalid template name")
	}
	path := filepath.Join(c.cfg.TemplatesDir, clean+".tex")
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("template %q not found", name)
	}
	return string(data), nil
}
