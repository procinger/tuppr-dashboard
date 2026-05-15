package tuppr

import (
	"context"

	"github.com/procinger/tuppr-dashboard/internal/k8s"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

type Service interface {
	ListKubernetesUpgradesCrd(ctx context.Context) (*unstructured.UnstructuredList, error)
	ListTalosUpgradesCrd(ctx context.Context) (*unstructured.UnstructuredList, error)
}

type svc struct {
}

func NewService() Service {
	return &svc{}
}

func (s *svc) ListKubernetesUpgradesCrd(ctx context.Context) (*unstructured.UnstructuredList, error) {
	upgrade, err := k8s.ListKubernetesUpgradesCrd()
	if err != nil {
		return nil, err
	}

	return upgrade, nil
}

func (s *svc) ListTalosUpgradesCrd(ctx context.Context) (*unstructured.UnstructuredList, error) {
	upgrade, err := k8s.ListTalosUpgradesCrd()
	if err != nil {
		return nil, err
	}
	return upgrade, nil
}
