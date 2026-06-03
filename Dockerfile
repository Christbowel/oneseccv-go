# ── Stage 1: Build Go binary ─────────────────────────────────
FROM golang:1.22-bookworm AS builder

WORKDIR /build/backend
COPY backend/go.mod ./
RUN go mod download

COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /build/oneseccv-server ./cmd/server

# ── Stage 2: Runtime with TeX Live ──────────────────────────
FROM debian:bookworm-slim

RUN groupadd -r oneseccv && useradd -r -g oneseccv -m -d /app oneseccv

# Install TeX Live (scheme-basic + needed packages) and poppler-utils for pdftoppm
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-latex-extra \
        texlive-fonts-recommended \
        texlive-fonts-extra \
        texlive-font-utils \
        lmodern \
        poppler-utils \
        fontconfig && \
    rm -rf /var/lib/apt/lists/* && \
    fc-cache -f

COPY --from=builder /build/oneseccv-server /app/oneseccv-server
COPY templates/ /app/templates/

RUN chown -R oneseccv:oneseccv /app

WORKDIR /app
USER oneseccv

ENV PORT=8090
ENV TEMPLATES_DIR=/app/templates

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:8090/api/v1/health || exit 1

ENTRYPOINT ["/app/oneseccv-server"]
