package tuppr

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

func (h *handler) ListKubernetesUpgradesCrd(w http.ResponseWriter, r *http.Request) {
	upgrade, err := h.service.ListKubernetesUpgradesCrd(r.Context())
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.Write(w, http.StatusOK, upgrade)
}

func (h *handler) ListTalosUpgradesCrd(w http.ResponseWriter, r *http.Request) {
	upgrade, err := h.service.ListTalosUpgradesCrd(r.Context())
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.Write(w, http.StatusOK, upgrade)
}
