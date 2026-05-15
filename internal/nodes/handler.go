package nodes

import (
	"log"
	"net/http"

	"github.com/procinger/tuppr-dashboard/internal/json"
)

type handler struct {
	service Service
}

func NewHandler(service Service) *handler {
	return &handler{
		service: service,
	}
}

func (h *handler) ListNodes(w http.ResponseWriter, r *http.Request) {
	nodes, err := h.service.ListNodes(r.Context())
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.Write(w, http.StatusOK, nodes)
}
