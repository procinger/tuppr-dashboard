package cmd

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/procinger/tuppr-dashboard/internal/nodes"
	"github.com/procinger/tuppr-dashboard/internal/static"
	"github.com/procinger/tuppr-dashboard/internal/tuppr"
)

type Application struct {
	Config Config
}

type Config struct {
	Addr string
}

func (app *Application) Mount() http.Handler {
	router := chi.NewRouter()

	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	router.Use(middleware.Timeout(30 * time.Second))

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	nodesService := nodes.NewService()
	nodesHandler := nodes.NewHandler(nodesService)
	router.Get("/nodes", nodesHandler.ListNodes)

	tupperService := tuppr.NewService()
	tupprHandler := tuppr.NewHandler(tupperService)
	router.Get("/tuppr/kubernetes", tupprHandler.ListKubernetesUpgradesCrd)
	router.Get("/tuppr/talos", tupprHandler.ListTalosUpgradesCrd)

	staticHandler := static.NewHandler()
	router.Handle("/*", http.HandlerFunc(staticHandler.StaticFiles))

	return router
}

func (app *Application) Run(h http.Handler) error {
	server := &http.Server{
		Addr:         app.Config.Addr,
		Handler:      h,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	log.Printf("server has started at port %s", app.Config.Addr)

	return server.ListenAndServe()
}
