package nodes

import (
	"context"

	"github.com/procinger/tuppr-dashboard/internal/k8s"
	"github.com/procinger/tuppr-dashboard/internal/types"

	corev1 "k8s.io/api/core/v1"
)

type Service interface {
	ListNodes(ctx context.Context) ([]types.Node, error)
}

type svc struct {
}

func NewService() Service {
	return &svc{}
}

func (s *svc) ListNodes(ctx context.Context) ([]types.Node, error) {
	nodes, err := k8s.ListNodes()

	var nodesList []types.Node
	for _, node := range nodes.Items {
		n := types.Node{
			Name:    node.Name,
			Status:  isNodeReady(node),
			Roles:   getNodeRole(node),
			Version: node.Status.NodeInfo.KubeletVersion,
			OSImage: node.Status.NodeInfo.OSImage,
			Kernel:  node.Status.NodeInfo.KernelVersion,
			Runtime: node.Status.NodeInfo.ContainerRuntimeVersion,
		}
		nodesList = append(nodesList, n)
	}

	return nodesList, err
}

func isNodeReady(node corev1.Node) bool {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

func getNodeRole(node corev1.Node) string {
	labels := node.Labels

	if _, ok := labels["node-role.kubernetes.io/control-plane"]; ok {
		return "control-plane"
	}

	if _, ok := labels["node-role.kubernetes.io/master"]; ok {
		return "master"
	}

	if _, ok := labels["node-role.kubernetes.io/worker"]; ok {
		return "worker"
	}

	return ""
}
