package types

type Node struct {
	Name    string `json:"name"`
	Status  bool   `json:"status"`
	Roles   string `json:"roles"`
	Version string `json:"version"`
	Runtime string `json:"runtime"`
	OSImage string `json:"os_image"`
	Kernel  string `json:"kernel"`
}

type Nodes struct {
	Nodes []Node `json:"nodes"`
}
