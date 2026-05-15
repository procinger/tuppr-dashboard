package k8s

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const (
	TUPPR_GROUP               = "tuppr.home-operations.com"
	TUPPR_VERSION             = "v1alpha1"
	TUPPR_RESOURCE_KUBERNETES = "kubernetesupgrades"
	TUPPR_RESOURCE_TALOS      = "talosupgrades"
)

func ListKubernetesUpgradesCrd() (*unstructured.UnstructuredList, error) {
	client, err := getDynamicClient()
	if err != nil {
		return nil, err
	}

	gvr := schema.GroupVersionResource{
		Group:    TUPPR_GROUP,
		Version:  TUPPR_VERSION,
		Resource: TUPPR_RESOURCE_KUBERNETES,
	}

	list, err := client.Resource(gvr).Namespace("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return list, nil
}

func ListTalosUpgradesCrd() (*unstructured.UnstructuredList, error) {
	client, err := getDynamicClient()
	if err != nil {
		return nil, err
	}

	gvr := schema.GroupVersionResource{
		Group:    TUPPR_GROUP,
		Version:  TUPPR_VERSION,
		Resource: TUPPR_RESOURCE_TALOS,
	}

	list, err := client.Resource(gvr).Namespace("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return list, nil
}
