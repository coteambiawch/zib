// File removed: Go backend is no longer needed.
package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

type Dialog struct {
	Text string `json:"text"`
}

var db *sql.DB

func getDialogs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	rows, err := db.Query("SELECT text FROM dialogs ORDER BY id DESC")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var dialogs []Dialog
	for rows.Next() {
		var d Dialog
		if err := rows.Scan(&d.Text); err == nil {
			dialogs = append(dialogs, d)
		}
	}
	json.NewEncoder(w).Encode(dialogs)
}

func addDialog(w http.ResponseWriter, r *http.Request) {
	var d Dialog
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	err := db.QueryRow("INSERT INTO dialogs (text) VALUES ($1) RETURNING text", d.Text).Scan(&d.Text)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

func main() {
	// Connect to Supabase Postgres
	var err error
	db, err = sql.Open("postgres", "postgresql://postgres:qwqw1212@@db.frskdsglexjeehahmiow.supabase.co:5432/postgres")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	// Create table if not exists
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS dialogs (
		id SERIAL PRIMARY KEY,
		text TEXT NOT NULL
	)`)
	if err != nil {
		log.Fatal("Failed to create table:", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/dialogs", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getDialogs(w, r)
		} else if r.Method == http.MethodPost {
			addDialog(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Enable CORS for frontend
	handler := cors.Default().Handler(mux)
	log.Println("Server running on http://0.0.0.0:8080 (accessible from your LAN IP)")
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", handler))
}
package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

type Dialog struct {
	Text string `json:"text"`
}

var db *sql.DB

func getDialogs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	rows, err := db.Query("SELECT text FROM dialogs ORDER BY id DESC")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var dialogs []Dialog
	for rows.Next() {
		var d Dialog
		if err := rows.Scan(&d.Text); err == nil {
			dialogs = append(dialogs, d)
		}
	}
	json.NewEncoder(w).Encode(dialogs)
}

func addDialog(w http.ResponseWriter, r *http.Request) {
	var d Dialog
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	err := db.QueryRow("INSERT INTO dialogs (text) VALUES ($1) RETURNING text", d.Text).Scan(&d.Text)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

func main() {
	// Connect to Supabase Postgres
	var err error
	db, err = sql.Open("postgres", "postgresql://postgres:qwqw1212@@db.frskdsglexjeehahmiow.supabase.co:5432/postgres")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	// Create table if not exists
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS dialogs (
		id SERIAL PRIMARY KEY,
		text TEXT NOT NULL
	)`)
	if err != nil {
		log.Fatal("Failed to create table:", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/dialogs", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getDialogs(w, r)
		} else if r.Method == http.MethodPost {
			addDialog(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Enable CORS for frontend
	handler := cors.Default().Handler(mux)
	log.Println("Server running on http://0.0.0.0:8080 (accessible from your LAN IP)")
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", handler))
}
