package acl

import (
	b64 "encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/rs/xid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ElasticseachConfig struct {
	Id           string
	Name         string
	Version      string
	ConfigString string
	Config       string
	Nodes        []Nodes
	Secrets      []ElasticseachSecret
}

type ElasticseachSecret struct {
	Name  string `json: name`
	Value string `json: value`
}

func (config *ElasticseachConfig) GetID() string {
	if config.Id == "" {
		config.Id = xid.New().String()
	}
	return config.Id
}

func (config *ElasticseachConfig) GenerateKVSecret() *unstructured.Unstructured {

	data := map[string]interface{}{}
	for _, secret := range config.Secrets {
		data[secret.Name] = b64.StdEncoding.EncodeToString([]byte(secret.Value))
	}
	secretObject := map[string]interface{}{
		"apiVersion": "v1",
		"kind":       "Secret",
		"metadata": map[string]interface{}{
			"name": config.Name + "-es-secrets",
		},
		"type": "Opaque",
		"data": data,
	}

	jdata, _ := json.Marshal(secretObject)
	logger.Debugf("%s", jdata)

	return &unstructured.Unstructured{Object: secretObject}
}

func (config *ElasticseachConfig) generateConfig() *unstructured.Unstructured {
	nodes := []map[string]interface{}{}

	configMap := make(map[string]interface{})
	json.Unmarshal([]byte(config.Config), &configMap)

	for _, n := range config.Nodes {
		configMap["node.master"] = n.Master
		configMap["node.data"] = n.Data
		configMap["node.ingest"] = n.Ingest
		configMap["node.store.allow_mmap"] = false

		node := map[string]interface{}{
			"name":        n.Name,
			"count":       n.InstanceCount,
			"podTemplate": createPodTemplate("elasticsearch", n.Cpu, n.Memory),
			"config":      configMap,
		}
		nodes = append(nodes, node)
	}

	secrets := []map[string]interface{}{map[string]interface{}{"secretName": config.Name + "-es-secrets"}}

	deploymentObject := map[string]interface{}{
		"apiVersion": "elasticsearch.k8s.elastic.co/v1",
		"kind":       "Elasticsearch",
		"metadata": map[string]interface{}{
			"name": config.Name,
		},
		"spec": map[string]interface{}{
			"secureSettings": secrets,
			"version":        config.Version,
			"nodeSets":       nodes,
		},
	}
	deployment := &unstructured.Unstructured{Object: deploymentObject}
	data, _ := json.Marshal(deploymentObject)
	logger.Debugf("%s", data)
	return deployment
}

func (config *ElasticseachConfig) updateConfig(deployment *unstructured.Unstructured) *unstructured.Unstructured {

	deployment.Object["spec"] = config.generateConfig().Object["spec"]
	return deployment
}
func (config *ElasticseachConfig) Deploy(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "elasticsearch.k8s.elastic.co", Version: "v1", Resource: "elasticsearches"}
	deployment := config.generateConfig()

	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).Get(config.Name, metav1.GetOptions{})
	if err != nil {
		//Resource Does not exist. Create
		result, err = kubeClient.Resource(deploymentRes).Namespace(namespace).Create(deployment, metav1.CreateOptions{})
	} else {
		err = config.Update(kubeClient, namespace)
		return err
	}
	if err != nil {
		logger.Warnf("Elasticsearch deploy error: %v", err)
		return err
	}
	logger.Infof("Created deployment %q.\n", result.GetName())
	return nil
}

func (config *ElasticseachConfig) CreateSecrests(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
	deployment := config.GenerateKVSecret()
	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).Create(deployment, metav1.CreateOptions{})
	if err != nil {
		err = kubeClient.Resource(deploymentRes).Namespace(namespace).Delete(fmt.Sprintf("%s-es-secrets", config.Name), &metav1.DeleteOptions{})
		result, err = kubeClient.Resource(deploymentRes).Namespace(namespace).Create(deployment, metav1.CreateOptions{})
		logger.Warnf("%v", err)
		return err
	}
	logger.Infof("Created Secrets %q.\n", result.GetName())
	return nil
}

func (config *ElasticseachConfig) Update(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "elasticsearch.k8s.elastic.co", Version: "v1", Resource: "elasticsearches"}
	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).Get(config.Name, metav1.GetOptions{})
	if err != nil {
		return err
	}
	depoloyment := config.updateConfig(result)
	result, err = kubeClient.Resource(deploymentRes).Namespace(namespace).Update(depoloyment, metav1.UpdateOptions{})
	return err
}

func (config *ElasticseachConfig) Status(client dynamic.Interface, namespace string) []Status {
	deploymentRes := schema.GroupVersionResource{Group: "elasticsearch.k8s.elastic.co", Version: "v1", Resource: "elasticsearches"}
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

func (config *ElasticseachConfig) Pods(client dynamic.Interface, namespace string) []unstructured.Unstructured {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	label := fmt.Sprintf("elasticsearch.k8s.elastic.co/cluster-name=%s", config.Name)
	result, _ := client.Resource(deploymentRes).Namespace(namespace).List(metav1.ListOptions{LabelSelector: label})
	return result.Items
}

func (config *ElasticseachConfig) Delete(client dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Group: "elasticsearch.k8s.elastic.co", Version: "v1", Resource: "elasticsearches"}
	err := client.Resource(deploymentRes).Namespace(namespace).Delete(config.Name, &metav1.DeleteOptions{})
	return err
}
