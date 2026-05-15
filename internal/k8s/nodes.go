package k8s

import (
	"context"

	v2 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func ListNodes() (*v2.NodeList, error) {
	clientset, err := ĝetClientSet()
	if err != nil {
		return nil, err
	}

	nodes, err := clientset.CoreV1().Nodes().List(context.Background(), v1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return nodes, nil
}
