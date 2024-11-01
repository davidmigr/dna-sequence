import json
import os
import http.client

# Load service configuration
def load_service_info():
    try:
        with open("service_info.json") as f:
            service_info = json.load(f)
            return service_info["host"], service_info["port"]
    except FileNotFoundError:
        print("Service information file not found. Make sure deploy.sh has been run.")
        exit(1)
    except KeyError:
        print("Invalid service information file format.")
        exit(1)

# Load the host and port from service_info.json
host, port = load_service_info()

def analyze_sequence(file_path, motif=None):
    """Reads multiple DNA sequences from a file and submits each for analysis."""
    if not os.path.exists(file_path):
        print("File not found.")
        return

    with open(file_path, 'r') as f:
        sequences = f.readlines()

    # Send each sequence as a separate API call
    for sequence in sequences:
        sequence = sequence.strip()
        if not sequence:
            continue  # Skip empty lines

        data = {"sequence": sequence}
        if motif:
            data["motif"] = motif

        conn = http.client.HTTPConnection(host, port)
        conn.request("POST", "/analyze", json.dumps(data), headers={"Content-Type": "application/json"})
        response = conn.getresponse()

        if response.status == 200:
            print("Sequence analyzed successfully:")
            print(json.dumps(json.loads(response.read()), indent=4))
        else:
            print("Failed to analyze sequence.")
            print(f"Status Code: {response.status}")
            print(f"Reason: {response.reason}")
            print("Response Content:")
            print(response.read().decode())
        conn.close()

def generate_report(motif=None):
    """Generates an aggregate report of DNA sequences."""
    data = {"motif": motif} if motif else {}

    conn = http.client.HTTPConnection(host, port)
    conn.request("POST", "/generate-report", json.dumps(data), headers={"Content-Type": "application/json"})
    response = conn.getresponse()

    if response.status == 200:
        print("Report generated successfully.")
        print(json.dumps(json.loads(response.read()), indent=4))
    else:
        print("Failed to generate report.")
        print(f"Status Code: {response.status}")
        print(f"Reason: {response.reason}")
        print("Response Content:")
        print(response.read().decode())
    conn.close()

def view_reports():
    """Fetches all reports."""
    conn = http.client.HTTPConnection(host, port)
    conn.request("GET", "/reports")
    response = conn.getresponse()

    if response.status == 200:
        reports = json.loads(response.read())
        if reports:
            print("Available reports:")
            print(json.dumps(reports, indent=4))
        else:
            print("No reports found.")
    else:
        print("Failed to retrieve reports.")
        print(f"Status Code: {response.status}")
        print(f"Reason: {response.reason}")
        print("Response Content:")
        print(response.read().decode())
    conn.close()

if __name__ == "__main__":
    print("DNA Sequences client")
    while True:
        print("\nOptions:")
        print("1. Analyze a DNA sequence file")
        print("2. Generate a report")
        print("3. View reports")
        print("4. Exit")
        
        choice = input("Enter choice: ")
        
        if choice == "1":
            file_path = input("Enter the path to the DNA sequence file: ")
            motif = input("Enter a motif (optional): ")
            analyze_sequence(file_path, motif if motif else None)
        elif choice == "2":
            motif = input("Enter a motif to include in the report (optional): ")
            generate_report(motif if motif else None)
        elif choice == "3":
            view_reports()
        elif choice == "4":
            print("Exiting.")
            break
        else:
            print("Invalid choice. Please select a valid option.")
