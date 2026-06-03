# ── Stage 1: Build Go binary ─────────────────────────────────
FROM golang:1.22-bookworm AS builder

WORKDIR /build/backend
COPY backend/go.mod ./
RUN go mod download

COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /build/oneseccv-server ./cmd/server

# ── Stage 2: Download Typst ─────────────────────────────────
FROM debian:bookworm-slim AS typst-dl

RUN apt-get update && apt-get install -y curl xz-utils && rm -rf /var/lib/apt/lists/*

ARG TYPST_VERSION=0.14.2
RUN curl -fsSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" \
    -o /tmp/typst.tar.xz && \
    tar -xf /tmp/typst.tar.xz -C /tmp && \
    mv /tmp/typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst && \
    chmod +x /usr/local/bin/typst && \
    rm -rf /tmp/*

# ── Stage 3: Runtime ────────────────────────────────────────
FROM debian:bookworm-slim

RUN groupadd -r oneseccv && useradd -r -g oneseccv -m -d /app oneseccv

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates fontconfig \
        fonts-noto-core fonts-liberation fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/* && \
    fc-cache -f

COPY --from=builder /build/oneseccv-server /app/oneseccv-server
COPY --from=typst-dl /usr/local/bin/typst /usr/local/bin/typst
COPY templates/ /app/templates/
COPY fonts/ /app/fonts/

RUN chown -R oneseccv:oneseccv /app

WORKDIR /app
USER oneseccv

ENV PORT=8090
ENV TYPST_BINARY=/usr/local/bin/typst
ENV TEMPLATES_DIR=/app/templates
ENV FONTS_DIR=/app/fonts

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD curl -f http://localhost:8090/api/v1/health || exit 1

ENTRYPOINT ["/app/oneseccv-server"]
