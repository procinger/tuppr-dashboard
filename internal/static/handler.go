package static

import (
	"net/http"
)

type handler struct {
	fs http.Handler
}

func NewHandler() *handler {
	filesDir := http.Dir("./static")

	return &handler{
		fs: http.FileServer(filesDir),
	}
}

func (h *handler) StaticFiles(w http.ResponseWriter, r *http.Request) {
	h.fs.ServeHTTP(w, r)
}
