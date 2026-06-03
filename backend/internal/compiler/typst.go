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

// Config holds compiler configuration.
type Config struct {
	TypstBinary  string
	TemplatesDir string
	FontsDir     string
	TempDir      string
	Timeout      time.Duration
	MaxFileSize  int64
}

// DefaultConfig returns sane defaults.
func DefaultConfig() Config {
	return Config{
		TypstBinary:  "typst",
		TemplatesDir: "./templates",
		FontsDir:     "./fonts",
		TempDir:      os.TempDir(),
		Timeout:      15 * time.Second,
		MaxFileSize:  512 * 1024,
	}
}

// Compiler handles Typst → PDF/PNG compilation.
type Compiler struct {
	cfg Config
}

// New creates a compiler with the given config.
func New(cfg Config) (*Compiler, error) {
	if _, err := exec.LookPath(cfg.TypstBinary); err != nil {
		return nil, fmt.Errorf("typst binary not found at %q: %w", cfg.TypstBinary, err)
	}
	if _, err := os.Stat(cfg.TemplatesDir); err != nil {
		return nil, fmt.Errorf("templates directory not found at %q: %w", cfg.TemplatesDir, err)
	}
	return &Compiler{cfg: cfg}, nil
}

// CompileResult holds PDF output.
type CompileResult struct {
	PDF      []byte
	Warnings []string
}

// PreviewResult holds PNG pages.
type PreviewResult struct {
	Pages [][]byte
}

func randomID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// CompilePDF compiles Typst source → PDF.
// Writes to a temp dir, compiles, cleans up. No data persists.
func (c *Compiler) CompilePDF(ctx context.Context, source string) (*CompileResult, error) {
	if int64(len(source)) > c.cfg.MaxFileSize {
		return nil, fmt.Errorf("source too large: %d bytes (max %d)", len(source), c.cfg.MaxFileSize)
	}
	if err := sanitizeSource(source); err != nil {
		return nil, err
	}

	workDir, err := c.createWorkDir()
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(workDir)

	inputPath := filepath.Join(workDir, "cv.typ")
	outputPath := filepath.Join(workDir, "cv.pdf")

	if err := os.WriteFile(inputPath, []byte(source), 0600); err != nil {
		return nil, fmt.Errorf("failed to write source: %w", err)
	}

	args := []string{
		"compile",
		inputPath,
		outputPath,
		"--font-path", c.cfg.FontsDir,
		"--font-path", c.cfg.TemplatesDir,
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.cfg.Timeout)
	defer cancel()

	cmd := exec.CommandContext(timeoutCtx, c.cfg.TypstBinary, args...)
	cmd.Dir = workDir
	cmd.Env = []string{
		"HOME=" + workDir,
		"TMPDIR=" + workDir,
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, fmt.Errorf("compilation timed out after %v", c.cfg.Timeout)
		}
		return nil, fmt.Errorf("compilation failed: %s\n%s", err, string(output))
	}

	pdf, err := os.ReadFile(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read output PDF: %w", err)
	}

	var warnings []string
	for _, line := range strings.Split(string(output), "\n") {
		line = strings.TrimSpace(line)
		if line != "" && strings.Contains(line, "warning") {
			warnings = append(warnings, line)
		}
	}

	return &CompileResult{PDF: pdf, Warnings: warnings}, nil
}

// CompilePreview compiles Typst source → PNG pages.
func (c *Compiler) CompilePreview(ctx context.Context, source string, ppi int) (*PreviewResult, error) {
	if int64(len(source)) > c.cfg.MaxFileSize {
		return nil, fmt.Errorf("source too large: %d bytes (max %d)", len(source), c.cfg.MaxFileSize)
	}
	if err := sanitizeSource(source); err != nil {
		return nil, err
	}
	if ppi <= 0 || ppi > 600 {
		ppi = 150
	}

	workDir, err := c.createWorkDir()
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(workDir)

	inputPath := filepath.Join(workDir, "cv.typ")
	outputPattern := filepath.Join(workDir, "cv-{n}.png")

	if err := os.WriteFile(inputPath, []byte(source), 0600); err != nil {
		return nil, fmt.Errorf("failed to write source: %w", err)
	}

	args := []string{
		"compile",
		inputPath,
		outputPattern,
		"--format", "png",
		"--ppi", fmt.Sprintf("%d", ppi),
		"--font-path", c.cfg.FontsDir,
		"--font-path", c.cfg.TemplatesDir,
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, c.cfg.Timeout)
	defer cancel()

	cmd := exec.CommandContext(timeoutCtx, c.cfg.TypstBinary, args...)
	cmd.Dir = workDir
	cmd.Env = []string{
		"HOME=" + workDir,
		"TMPDIR=" + workDir,
	}

	if output, err := cmd.CombinedOutput(); err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, fmt.Errorf("compilation timed out after %v", c.cfg.Timeout)
		}
		return nil, fmt.Errorf("compilation failed: %s\n%s", err, string(output))
	}

	var pages [][]byte
	for i := 1; ; i++ {
		pagePath := filepath.Join(workDir, fmt.Sprintf("cv-%d.png", i))
		data, err := os.ReadFile(pagePath)
		if err != nil {
			break
		}
		pages = append(pages, data)
	}
	if len(pages) == 0 {
		return nil, fmt.Errorf("compilation produced no pages")
	}

	return &PreviewResult{Pages: pages}, nil
}

func (c *Compiler) createWorkDir() (string, error) {
	id := randomID()
	dir := filepath.Join(c.cfg.TempDir, "oneseccv-"+id)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", fmt.Errorf("failed to create work dir: %w", err)
	}
	return dir, nil
}

// sanitizeSource blocks dangerous constructs. Typst is sandboxed by design
// (no shell access unlike LaTeX), but we add defense-in-depth.
func sanitizeSource(source string) error {
	dangerous := []string{
		"read(",
		"include(",
	}
	lower := strings.ToLower(source)
	for _, pattern := range dangerous {
		if strings.Contains(lower, pattern) {
			return fmt.Errorf("source contains blocked construct: %q", pattern)
		}
	}
	return nil
}

// ListTemplates returns available template slugs.
func (c *Compiler) ListTemplates() ([]string, error) {
	entries, err := os.ReadDir(c.cfg.TemplatesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read templates dir: %w", err)
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".typ") {
			names = append(names, strings.TrimSuffix(e.Name(), ".typ"))
		}
	}
	return names, nil
}

// GetTemplate reads a template's source by slug. Rejects path traversal.
func (c *Compiler) GetTemplate(name string) (string, error) {
	clean := filepath.Base(name)
	if clean != name || strings.Contains(name, "..") {
		return "", fmt.Errorf("invalid template name")
	}
	path := filepath.Join(c.cfg.TemplatesDir, clean+".typ")
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("template %q not found", name)
	}
	return string(data), nil
}
