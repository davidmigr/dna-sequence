### 0. Quick Start Guide

1. **Deploy the Backend**  
   Run `./deploy.sh` to set up backend services in Kubernetes. This script builds and deploys the necessary services and starts a Minikube tunnel to allow client access.

2. **Run the Client**  
   Start the client interface with:
   ```bash
   python3 dna-client.py
   ```
   This will prompt you with the following options:
   - **1. Analyze a DNA Sequence File**: Input a file (e.g., `sequences.txt`, one sequence per line) and optionally specify a motif for analysis.
   - **2. Generate a Report**: Aggregate analyzed data, optionally filtered by a motif.
   - **3. View Reports**: Display stored reports.
   - **4. Exit**: Close the client.

3. **Using Custom Sequence Files**  
   You can use `sequences.txt` as an example file or provide your own file with one DNA sequence per line.


### 1. Software Description

The software system is designed to analyze and aggregate DNA sequence data based on specific motifs. It consists of two primary services:

- **DNA Analyzer Service**: Processes and analyzes individual DNA sequences, identifies specific motifs within sequences, and provides this data to other services.
- **Genetic Data Aggregator Service**: Aggregates analysis results from the DNA Analyzer Service, calculates averages, and generates summary reports based on motifs found within sequences.

The architecture is containerized and deployed on Kubernetes, utilizing microservices and MongoDB for data storage.

### 2. Software Architecture Design

#### Components and Responsibilities

1. **DNA Analyzer Service** (`analyzer-service`)
   - **Responsibility**: Receives DNA sequences, analyzes for specified motifs, and returns motif matches and statistics for each sequence.
   - **Endpoints**: Exposes `/analyze` (for analyzing DNA sequences) and `/sequences` (for retrieving analyzed sequences).
   - **Database**: Connects to MongoDB to persist analyzed sequences, allowing retrieval for report generation by the Aggregator Service.

2. **Genetic Data Aggregator Service** (`aggregator-service`)
   - **Responsibility**: Retrieves DNA sequence data from the DNA Analyzer Service, performs aggregation (average content percentage, length, and motif counts), and stores reports in MongoDB.
   - **Endpoints**: Exposes `/generate-report` (for creating new aggregated reports based on motif) and `/reports` (for retrieving stored reports).
   - **Database**: Stores aggregation reports, enabling efficient retrieval and historical record-keeping.

3. **MongoDB** (`mongo-deployment`)
   - **Purpose**: Stores both sequence analysis results and aggregated reports.
   - **Access**: Both `analyzer-service` and `aggregator-service` access MongoDB to store and retrieve data.

4. **Nginx Reverse Proxy** (`nginx-reverse-proxy`)
   - **Responsibility**: Routes requests from clients to either the `analyzer-service` or `aggregator-service` based on URL paths.
   - **Configuration**: Configured via a Kubernetes `ConfigMap`, allowing flexible route management without modifying service code.
   - **Service Exposure**: The reverse proxy exposes services via a LoadBalancer service, making them accessible externally.

#### Microservices Mapping and Architecture Principles

- **Microservices**: Each service (DNA Analyzer and Genetic Data Aggregator) operates independently, following the *single-responsibility principle*. This modular approach facilitates scalability, maintainability, and isolated deployment of each service.
- **Data Persistence**: MongoDB serves as a persistent store, implementing the *database-per-service pattern*. Each service is designed to interact with MongoDB independently, simplifying data isolation.
- **Deployment and Scaling**: The Kubernetes configuration defines separate `Deployment` resources with replicas, ensuring each service is load-balanced and resilient to faults.
- **Cloud-Native Principles**: By using Kubernetes, the application benefits from *container orchestration*, automated scaling, and rolling updates. The reverse proxy pattern with Nginx and the LoadBalancer pattern ensure good user access to services.

### 3. Benefits and Challenges of the Architecture

#### Benefits

- **Scalability**: Kubernetes orchestration allows each service to scale horizontally, adjusting to high-demand DNA analysis or reporting tasks.
- **Resilience**: With services deployed as replicas, the architecture is fault-tolerant. If one instance fails, Kubernetes can redirect requests to healthy instances, enhancing reliability.
- **Maintainability**: The microservices architecture enables isolated development and deployment. Each service can be updated independently, facilitating rapid iteration.
- **Modularity**: The separation of roles (analyzer vs. aggregator) keeps codebases streamlined, which improves readability and reduces complexity.

#### Challenges

- **Data Consistency**: With distributed services reading from and writing to MongoDB, there's a potential for data inconsistency, especially with high concurrency, as it was focused in our last quiz.
  - *Mitigation*: Ensuring database transactions and using techniques (like optimistic locking) to maintain consistency.

- **Security Risk Generally By Exposing Services**: Exposing services via LoadBalancer increases the risk of unauthorized access and data breaches.
  - *Mitigation*: Implementing API authentication and HTTPS encryption for communication between services, along with network policies to restrict access, can enhance security.

- **Security Risk Specifically By Code Injection**: Allowing unchecked input is a vulnerability because the server might execute malicious code in some way.
  - *Mitigation*: Implementing input verification, trust nothing coming from the client-side.

- **Cross-Service Communication Overhead**: Frequent communication between services (e.g., Aggregator fetching from Analyzer) can introduce latency.
  - *Mitigation*: Caching sequence data in memory or storing aggregate-ready data in the database could reduce repetitive requests.

- **Data Durability Beyond PVCs**: PVCs help maintain data through pod lifecycle events, but they don’t provide protection against data corruption or deletion.
  - *Mitigation*: Having a backup and restore Strategy, in which regularly scheduled backups (using MongoDB tools or Kubernetes CronJobs) provide a reliable recovery path in cases of data corruption, accidental deletion, or critical volume failures.

- **Scalability and High Availability**: A single-instance MongoDB setup, even with PVCs, doesn’t handle high traffic effectively or automatically recover from node failures.
  - *Mitigation*: Having MongoDB Replica Set or Sharding, which allows for horizontal scaling and automatic failover. This setup enables MongoDB to manage higher loads and provides high availability, as data and traffic can be distributed across nodes.


### 4. Link to GitHub
https://github.com/davidmigr/dna-sequencer
