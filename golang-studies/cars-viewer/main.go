package main

import (
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
)

func main() {

	apiServerCmd := startApiServer()
	handleShutdown(apiServerCmd)
	startMainServer()
}

func startApiServer() *exec.Cmd {

	cmd := exec.Command("make", "run")
	cmd.Dir = "./api"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		log.Fatalf("Error starting API server: %v", err)
	}

	log.Println("API server started on: 3000")

	return cmd
}

func handleShutdown(apiServerCmd *exec.Cmd) {

	exit := make(chan os.Signal, 1) //channel to capture interrupt signals to shutdown
	signal.Notify(exit, os.Interrupt)

	go func() {

		<-exit
		log.Println("Shutting down servers...")

		//send SIGTERM to the process (API)
		if err := apiServerCmd.Process.Signal(syscall.SIGTERM); err != nil {
			log.Fatalf("Failed to stop API server: %v", err)
		}

		//wait for API process to exit
		err := apiServerCmd.Wait()
		if err != nil && err.Error() != "signal: terminated" {
			log.Fatalf("Failed to wait for API server to stop: %v", err)
		}
		log.Println("API server stopped")
		log.Println("Program stopped")
		os.Exit(0)
	}()
}

func startMainServer() {

	http.HandleFunc("/", MainPageHandler)
	http.HandleFunc("/info", InfoPageHandler)
	http.HandleFunc("/search", SearchHandler)
	http.HandleFunc("/compare", CompareHandler)

	// Serve static files from /api/img directory
	http.Handle("/api/img/", http.StripPrefix("/api/img/", http.FileServer(http.Dir("./api/img"))))

	// Serve other static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

	log.Println("Main server started on: http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Error starting a main server: %v", err)
	}
}
