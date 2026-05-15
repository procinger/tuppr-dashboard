package main

import (
	slog "log/slog"
	"os"

	"github.com/procinger/tuppr-dashboard/cmd"
)

const (
	DefaultDashboardPort = ":8080"
)

func main() {
	dashboardPort := os.Getenv("DASHBOARD_PORT")
	if dashboardPort == "" {
		dashboardPort = DefaultDashboardPort
	}

	cfg := cmd.Config{
		Addr: dashboardPort,
	}

	api := cmd.Application{
		Config: cfg,
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	if err := api.Run(api.Mount()); err != nil {
		slog.Error("server failed to start", "error", err)
		os.Exit(1)
	}
}
