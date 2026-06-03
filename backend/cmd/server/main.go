package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Christbowel/oneseccv-go/backend/internal/compiler"
	"github.com/Christbowel/oneseccv-go/backend/internal/handlers"
	"github.com/Christbowel/oneseccv-go/backend/internal/middleware"
)

func main() {
	port := flag.Int("port", 8090, "Server port")
	typstBin := flag.String("typst", "typst", "Path to typst binary")
	templatesDir := flag.String("templates", "../templates", "Templates directory")
	fontsDir := flag.String("fonts", "../fonts", "Custom fonts directory")
	allowedOrigins := flag.String("origins", "*", "CORS origins (comma-separated)")
	rateLimit := flag.Int("rate-limit", 30, "Requests/minute/IP")
	flag.Parse()

	// Env overrides
	if v := os.Getenv("PORT"); v != "" {
		fmt.Sscanf(v, "%d", port)
	}
	if v := os.Getenv("TYPST_BINARY"); v != "" {
		*typstBin = v
	}
	if v := os.Getenv("TEMPLATES_DIR"); v != "" {
		*templatesDir = v
	}
	if v := os.Getenv("FONTS_DIR"); v != "" {
		*fontsDir = v
	}
	if v := os.Getenv("ALLOWED_ORIGINS"); v != "" {
		*allowedOrigins = v
	}

	cfg := compiler.Config{
		TypstBinary:  *typstBin,
		TemplatesDir: *templatesDir,
		FontsDir:     *fontsDir,
		TempDir:      os.TempDir(),
		Timeout:      15 * time.Second,
		MaxFileSize:  512 * 1024,
	}

	comp, err := compiler.New(cfg)
	if err != nil {
		log.Fatalf("Failed to init compiler: %v", err)
	}

	h := handlers.New(comp)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/health", h.Health)
	mux.HandleFunc("/api/v1/compile", h.Compile)
	mux.HandleFunc("/api/v1/compile/pdf", h.CompilePDFDirect)
	mux.HandleFunc("/api/v1/preview", h.Preview)
	mux.HandleFunc("/api/v1/templates", h.ListTemplates)
	mux.HandleFunc("/api/v1/template", h.GetTemplate)

	origins := strings.Split(*allowedOrigins, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	rateLimiter := middleware.NewRateLimiter(*rateLimit, time.Minute)
	corsMiddleware := middleware.CORS(origins)

	var handler http.Handler = mux
	handler = middleware.MaxBodySize(2 << 20)(handler)
	handler = rateLimiter.Middleware(handler)
	handler = corsMiddleware(handler)
	handler = middleware.SecureHeaders(handler)
	handler = middleware.Logger(handler)

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("OneSecCV v3 compiler on %s", addr)
	log.Printf("  typst=%s  templates=%s  fonts=%s", *typstBin, *templatesDir, *fontsDir)
	log.Printf("  rate=%d/min  cors=%s", *rateLimit, *allowedOrigins)

	srv := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
