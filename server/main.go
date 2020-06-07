package main

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/markbates/pkger"
	"github.com/robrotheram/eckmanager/acl"
	"github.com/robrotheram/eckmanager/api"
	"github.com/robrotheram/eckmanager/audit"
	"github.com/robrotheram/eckmanager/conf"
	"github.com/robrotheram/eckmanager/containerMetrics"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/metrics/pkg/client/clientset/versioned"
	metrics "k8s.io/metrics/pkg/client/clientset/versioned"
)

var logger *logrus.Logger
var rootCmd = cobra.Command{
	Use: "example",
	Run: run,
}

// RootCommand will setup and return the root command
func rootCommand() *cobra.Command {
	rootCmd.PersistentFlags().StringP("config", "c", "", "the config file to use")
	return &rootCmd
}

func run(cmd *cobra.Command, args []string) {
	config, err := conf.LoadConfig(cmd)
	if err != nil {
		log.Fatal("Failed to load config: " + err.Error())
	}

	logger, err = conf.ConfigureLogging(&config.Logging)
	if err != nil {
		log.Fatal("Failed to configure logging: " + err.Error())
	}
	setupAuditEvents(config)

	kubeClinet, meticClient := kubeClientSetup(&config.Kube)
	datastore := setupDatastore(config)
	apiserver := setupAPIServer(datastore, kubeClinet, meticClient)

	setupPodMonitoring(apiserver, meticClient)
	setupAuditEvents(config)
	startServer(config, apiserver)

}

func setupAuditEvents(config *conf.Config) {
	auditlogger := audit.LogWriter{FilePath: config.Logging.Dir + "/eckmanager-audit.out"}
	err := auditlogger.Setup()
	if err != nil {
		fmt.Println(err)
		return
	}
	audit.AddWriter(&auditlogger)

	consolelogger := audit.ConsoleWriter{}
	err = consolelogger.Setup()
	audit.AddWriter(&consolelogger)

	go audit.AuditProcessor()
}

func kubeClientSetup(kubeConf *conf.KubeConfig) (dynamic.Interface, *versioned.Clientset) {
	config, err := clientcmd.BuildConfigFromFlags("", kubeConf.ConfigPath)
	if err != nil {
		logger.Errorf("Unable to commiticate with cluster error: %v", err)
		os.Exit(1)
	}
	mc, err := metrics.NewForConfig(config)

	if err != nil {
		logger.Errorf("Unable to commiticate with cluster error: %v", err)
		os.Exit(1)
	}
	client, err := dynamic.NewForConfig(config)

	if err != nil {
		logger.Errorf("Unable to commiticate with cluster error: %v", err)
		os.Exit(1)

	}

	return client, mc
}

func setupPodMonitoring(apiServer *api.API, mc *versioned.Clientset) {
	namespaces, err := apiServer.GetProjects()
	if err == nil {
		for _, n := range namespaces {
			containerMetrics.AddNamespaceMetrics(n, mc)
		}
	}
}

func setupDatastore(config *conf.Config) *acl.Datastore {
	datastore, err := acl.NewDB(&config.Database, logger)
	if err != nil {
		logger.Errorf("Database initisation error: %v", err)
		os.Exit(1)
	}
	return datastore
}

func setupAPIServer(datastore *acl.Datastore, kubeclent dynamic.Interface, metricclient *versioned.Clientset) *api.API {
	apiServer := api.InitAPI(*datastore, kubeclent, metricclient, logger)

	return apiServer
}

func spaHandler() http.HandlerFunc {
	f, _ := pkger.Open("/ui/index.html")
	tmplContent, _ := ioutil.ReadAll(f)
	tmplString := string(tmplContent)
	tmpl, _ := template.New("T").Parse(tmplString)

	return func(w http.ResponseWriter, r *http.Request) {
		tmpl.Execute(w, nil)
	}
}

func startServer(config *conf.Config, apiServer *api.API) {
	port := ":" + config.Server.Port

	r := mux.NewRouter()
	apiServer.InitApiRoutes(r)

	staticHandler := http.FileServer(pkger.Dir("/ui"))
	r.PathPrefix("/static/").Handler(staticHandler)
	r.PathPrefix("/").HandlerFunc(spaHandler())

	headers := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
	methods := handlers.AllowedMethods([]string{"GET", "POST", "DELETE", "PUT", "HEAD", "OPTIONS"})
	origins := handlers.AllowedOrigins([]string{"*"})

	logger.Println("Starting server on port" + port)
	log.Fatal(http.ListenAndServe(port, handlers.CORS(headers, methods, origins)(r)))
}

func main() {
	if err := rootCommand().Execute(); err != nil {
		log.Fatal(err)
	}
}
