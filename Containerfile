FROM docker.io/golang:1.26.3-alpine3.22 AS builder

WORKDIR /

RUN mkdir -p /root/.cache

COPY go.mod go.mod
COPY go.sum go.sum
COPY main.go  main.go
COPY cmd cmd
COPY internal internal

RUN --mount=type=cache,target=/vendor go mod download
RUN --mount=type=cache,target=/root/.cache GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -ldflags="-w -s" -o dashboard

####### api

FROM scratch

WORKDIR /

USER 65532:65532

COPY --from=builder /dashboard /dashboard
COPY static /static

ENTRYPOINT ["/dashboard"]
