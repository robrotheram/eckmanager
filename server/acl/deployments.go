package acl

import (
	"fmt"
	"strconv"
	"time"

	b64 "encoding/base64"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type KubeDeployment interface {
	gernerateConfig()
	Deploy(dynamic.Interface, string)
	Status(dynamic.Interface, string)
	Get(dynamic.Interface, string)
}

type Status struct {
	Health       string `json:"health"`
	Nodes        string `json:"nodes"`
	Version      string `json:"version"`
	Phase        string `json:"phase"`
	CreationTime string `json:"age"`
}

type KubeEvent struct {
	Type          string    `json:"type"`
	Reason        string    `json:"reason"`
	Message       string    `json:"message"`
	Component     string    `json:"component"`
	LastTimestamp time.Time `json:"last_timestamp"`
}

type Deployment struct {
	ID                 string             `json:"id" storm:"id"`
	Name               string             `json:"name" storm:"unique"`
	Version            string             `json:"resource_version"`
	BaseURL            string             `json:"base_url"`
	ElasticseachConfig ElasticseachConfig `json:"elasticsearch"`
	KibanaConfig       KibanaConfig       `json:"kibana"`
}

type ResourceLimits struct {
	RequestCPU    float32 `json:"version"`
	RequestMemory int     `json:"version"`
	LimitCPU      float32 `json:"version"`
	LimitMemory   int     `json:"version"`
}
type Nodes struct {
	ID            string
	Master        bool
	Data          bool
	Ingest        bool
	Name          string
	InstanceCount int
	Cpu           string
	Memory        string
}

func (d *Deployment) Update(newD Deployment) {
	if newD.Name != "" {
		d.Name = newD.Name
	}
	if newD.Version != "" {
		d.Version = newD.Version
	}
	if newD.BaseURL != "" {
		d.BaseURL = newD.BaseURL
	}

	if newD.ElasticseachConfig.Name != "" {
		d.ElasticseachConfig = newD.ElasticseachConfig
	}
	if newD.KibanaConfig.Name != "" {
		d.KibanaConfig = newD.KibanaConfig
	}
}
func createPodTemplate(name, cpu, memory string) map[string]interface{} {
	if cpu == "" {
		cpu = "1"
	}
	if memory == "" {
		memory = "2"
	}
	jvm := "1"

	i1, err := strconv.Atoi(memory)
	if err == nil {
		jvm = fmt.Sprintf("%d", (i1 / 2))
	}

	return map[string]interface{}{
		"spec": map[string]interface{}{
			"containers": []map[string]interface{}{
				map[string]interface{}{
					"name": name,
					"env": []map[string]interface{}{
						map[string]interface{}{
							"name":  "ES_JAVA_OPTS",
							"value": fmt.Sprintf("-Xms%sg -Xmx%sg", jvm, jvm),
						},
					},
					"resources": map[string]interface{}{
						"requests": map[string]interface{}{
							"memory": fmt.Sprintf("%sGi", memory),
							"cpu":    cpu,
						},
						"limits": map[string]interface{}{
							"memory": fmt.Sprintf("%sGi", memory),
							"cpu":    cpu,
						},
					},
				},
			},
		},
	}
}

func decodeSecret(secret string) string {
	sDec, _ := b64.StdEncoding.DecodeString(secret)
	return string(sDec)
}

func (d *Deployment) GetSecrets(kubeClient dynamic.Interface, namespace string) ([]map[string]string, error) {
	label := fmt.Sprintf("eck.k8s.elastic.co/credentials=true, elasticsearch.k8s.elastic.co/cluster-name=%s", d.ElasticseachConfig.Name)
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
	result, err := kubeClient.Resource(deploymentRes).Namespace(namespace).List(metav1.ListOptions{LabelSelector: label})
	secrets := []map[string]string{}

	for _, item := range result.Items {
		data, found, err := unstructured.NestedMap(item.Object, "data")
		if err != nil || !found {
			fmt.Printf("Status not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		meta, found, err := unstructured.NestedMap(item.Object, "metadata")
		if err != nil || !found {
			fmt.Printf("Status not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}

		for key, element := range data {
			secret := map[string]string{}
			k := fmt.Sprintf("%v", meta["name"])
			v := decodeSecret(fmt.Sprintf("%v", element))
			secret[k] = fmt.Sprintf("username: %s, password: %s", key, v)
			secrets = append(secrets, secret)
		}

	}

	return secrets, err
}

func (d *Deployment) DeleteSecrets(kubeClient dynamic.Interface, namespace string) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
	secrets, err := d.GetSecrets(kubeClient, namespace)
	if err != nil {
		return err
	}
	for _, secret := range secrets {
		for k := range secret {
			err := kubeClient.Resource(deploymentRes).Namespace(namespace).Delete(k, &metav1.DeleteOptions{})
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (d *Deployment) GetElasitcURL() string {
	return fmt.Sprintf("%s.%s", d.ElasticseachConfig.Id, d.BaseURL)
}
func (d *Deployment) GetKibanaURL() string {
	return fmt.Sprintf("%s.%s", d.KibanaConfig.Id, d.BaseURL)
}

func (d *Deployment) GenerateKVSecret(secrets []ElasticseachSecret) *unstructured.Unstructured {

	data := []map[string]interface{}{}
	for i := range secrets {
		data = append(data, map[string]interface{}{
			secrets[i].Name: b64.StdEncoding.EncodeToString([]byte(secrets[i].Value)),
		})
	}
	secretObject := map[string]interface{}{
		"apiVersion": "v1",
		"kind":       "Secret",
		"metadata": map[string]interface{}{
			"name": d.Name + "-secrets",
		},
		"type": "Opaque",
		"data": data,
	}
	return &unstructured.Unstructured{Object: secretObject}
}
