package acl

import (
	"fmt"

	"github.com/rs/xid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type KibanaConfig struct {
	Id            string
	Name          string
	InstanceCount int
	Version       string
	ESRef         string
	Cpu           string
	Memory        string
}

func (config *KibanaConfig) GetID() string {
	if config.Id == "" {
		config.Id = xid.New().String()
	}
	return config.Id
}

func (config *KibanaConfig) generateConfig() *unstructured.Unstructured {
	deployment := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "kibana.k8s.elastic.co/v1",
			"kind":       "Kibana",
			"metadata": map[string]interface{}{
				"name": config.Name,
			},
			"spec": map[string]interface{}{
				"version": config.Version,
				"count":   config.InstanceCount,
				"elasticsearchRef": map[string]interface{}{
					"name": config.ESRef,
				},
				"podTemplate": createPodTemplate("kibana", config.Cpu, config.Memory),
			},
		},
	}
	return deployment
}
func (config *KibanaConfig) updateConfig(deployment *unstructured.Unstructured) *unstructured.Unstructured {
	spec := deployment.Object["spec"].(map[string]interface{})
	spec["count"] = config.InstanceCount
	spec["version"] = config.Version
	return deployment
}

func (config *KibanaConfig) Deploy(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "kibana.k8s.elastic.co", Version: "v1", Resource: "kibanas"}
	deployment := config.generateConfig()

	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).Create(deployment, metav1.CreateOptions{})
	if err != nil {
		err = config.Update(kubeClient, namespace)
		return err

	}
	logger.Infof("Created deployment %q.\n", result.GetName())
	return nil
}

func (config *KibanaConfig) Update(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "kibana.k8s.elastic.co", Version: "v1", Resource: "kibanas"}
	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).Get(config.Name, metav1.GetOptions{})
	if err != nil {
		return err
	}
	depoloyment := config.updateConfig(result)
	result, err = kubeClient.Resource(deploymentRes).Namespace(namespace).Update(depoloyment, metav1.UpdateOptions{})
	return err
}

func (config *KibanaConfig) Status(client dynamic.Interface, namespace string) []Status {
	deploymentRes := schema.GroupVersionResource{Group: "kibana.k8s.elastic.co", Version: "v1", Resource: "kibanas"}
	label := fmt.Sprintf("metadata.name=%s", config.Name)
	result, _ := client.Resource(deploymentRes).Namespace(namespace).List(metav1.ListOptions{FieldSelector: label})
	status := []Status{}
	for _, item := range result.Items {
		stats, found, err := unstructured.NestedMap(item.Object, "status")
		if err != nil || !found {
			logger.Warnf("Status not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		spec, found, err := unstructured.NestedMap(item.Object, "spec")
		if err != nil || !found {
			logger.Warnf("Status not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		meta, found, err := unstructured.NestedMap(item.Object, "metadata")
		if err != nil || !found {
			logger.Warnf("Status not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		status = append(status, Status{
			Health:       fmt.Sprintf("%v", stats["health"]),
			Phase:        fmt.Sprintf("%v", stats["phase"]),
			Nodes:        fmt.Sprintf("%v", stats["availableNodes"]),
			Version:      fmt.Sprintf("%v", spec["version"]),
			CreationTime: fmt.Sprintf("%v", meta["creationTimestamp"]),
		})
	}
	return status
}

func (config *KibanaConfig) Pods(client dynamic.Interface, namespace string) []unstructured.Unstructured {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	label := fmt.Sprintf("kibana.k8s.elastic.co/name=%s", config.Name)
	result, _ := client.Resource(deploymentRes).Namespace(namespace).List(metav1.ListOptions{LabelSelector: label})
	return result.Items
}

func (config *KibanaConfig) Delete(client dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "kibana.k8s.elastic.co", Version: "v1", Resource: "kibanas"}
	err := client.Resource(deploymentRes).Namespace(namespace).Delete(config.Name, &metav1.DeleteOptions{})
	return err
}
