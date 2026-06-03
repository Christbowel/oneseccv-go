package handlers

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/Christbowel/oneseccv-go/backend/internal/compiler"
)

// Handler holds shared dependencies.
type Handler struct {
	compiler *compiler.Compiler
}

// New creates a Handler.
func New(c *compiler.Compiler) *Handler {
	return &Handler{compiler: c}
}

// ── Types ───────────────────────────────────────────────────

type CompileRequest struct {
	Source string `json:"source"`
}

type CompileResponse struct {
	PDF      string   `json:"pdf"`
	Warnings []string `json:"warnings,omitempty"`
}

type PreviewRequest struct {
	Source string `json:"source"`
	PPI    int    `json:"ppi,omitempty"`
}

type PreviewResponse struct {
	Pages []string `json:"pages"`
}

type TemplateInfo struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type TemplateDetailResponse struct {
	Slug   string `json:"slug"`
	Source string `json:"source"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp"`
}

// ── Handlers ────────────────────────────────────────────────

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{
		Status:    "ok",
		Version:   "3.0.0",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handler) Compile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST only")
		return
	}

	var req CompileRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Source == "" {
		writeError(w, http.StatusBadRequest, "source is required")
		return
	}

	start := time.Now()
	result, err := h.compiler.CompilePDF(r.Context(), req.Source)
	elapsed := time.Since(start)

	if err != nil {
		log.Printf("[COMPILE] FAIL %v: %v", elapsed, err)
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	log.Printf("[COMPILE] OK %v — %d bytes, %d warnings", elapsed, len(result.PDF), len(result.Warnings))
	writeJSON(w, http.StatusOK, CompileResponse{
		PDF:      base64.StdEncoding.EncodeToString(result.PDF),
		Warnings: result.Warnings,
	})
}

func (h *Handler) CompilePDFDirect(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST only")
		return
	}

	var req CompileRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Source == "" {
		writeError(w, http.StatusBadRequest, "source is required")
		return
	}

	result, err := h.compiler.CompilePDF(r.Context(), req.Source)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="cv.pdf"`)
	w.Header().Set("Content-Length", strconv.Itoa(len(result.PDF)))
	w.WriteHeader(http.StatusOK)
	w.Write(result.PDF)
}

func (h *Handler) Preview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST only")
		return
	}

	var req PreviewRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Source == "" {
		writeError(w, http.StatusBadRequest, "source is required")
		return
	}

	ppi := req.PPI
	if ppi == 0 {
		ppi = 150
	}

	start := time.Now()
	result, err := h.compiler.CompilePreview(r.Context(), req.Source, ppi)
	elapsed := time.Since(start)

	if err != nil {
		log.Printf("[PREVIEW] FAIL %v: %v", elapsed, err)
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	log.Printf("[PREVIEW] OK %v — %d page(s)", elapsed, len(result.Pages))
	var pages []string
	for _, p := range result.Pages {
		pages = append(pages, base64.StdEncoding.EncodeToString(p))
	}
	writeJSON(w, http.StatusOK, PreviewResponse{Pages: pages})
}

func (h *Handler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "GET only")
		return
	}

	names, err := h.compiler.ListTemplates()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var templates []TemplateInfo
	for _, name := range names {
		templates = append(templates, TemplateInfo{
			Name: slugToName(name),
			Slug: name,
		})
	}
	writeJSON(w, http.StatusOK, templates)
}

func (h *Handler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "GET only")
		return
	}

	slug := r.URL.Query().Get("slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug parameter required")
		return
	}

	source, err := h.compiler.GetTemplate(slug)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, TemplateDetailResponse{Slug: slug, Source: source})
}

// ── Helpers ─────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, ErrorResponse{Error: msg})
}

func readJSON(r *http.Request, v interface{}) error {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return err
	}
	defer r.Body.Close()
	return json.Unmarshal(body, v)
}

func slugToName(slug string) string {
	parts := make([]byte, 0, len(slug))
	upper := true
	for _, c := range slug {
		if c == '-' || c == '_' {
			parts = append(parts, ' ')
			upper = true
			continue
		}
		if upper && c >= 'a' && c <= 'z' {
			parts = append(parts, byte(c-32))
			upper = false
		} else {
			parts = append(parts, byte(c))
			upper = false
		}
	}
	return string(parts)
}
