# 📘 System Design Diagram & Notation Guide

This guide explains the symbols, notations, and logic used in the HireFlow system diagrams. Use this to answer questions about "What does this arrow mean?" or "What is this relationship?"

---

## 1. Notation Legend

### **A. Use Case Diagram (UML)**
- **Stick Figure**: Represents an **Actor** (User or External System).
- **Oval**: Represents a **Use Case** (A specific feature or action).
- **Box**: The **System Boundary** (HireFlow Backend).
- **Solid Line**: A relationship between an actor and a feature.
- **<<include>>**: Means a feature *must* use another feature (e.g., Score Candidate *includes* Parse Resume).

### **B. Class Diagram (UML)**
- **Box**: A Class or Interface.
- **+ Name**: Public method/property.
- **- Name**: Private method/property.
- **Dashed Arrow (---->)**: **Dependency** (One class uses another).
- **Triangle Head Arrow**: **Inheritance/Implementation** (A class implements an interface).
- **Diamond Head**: **Composition/Aggregation** (A class "owns" another class).

### **C. Entity Relationship (ER) Diagram (Crow's Foot)**
- **||--o{**: **One-to-Many** (e.g., One Tenant has Many Users).
- **||--||**: **One-to-One** (e.g., One Job has One Pipeline).
- **FK**: Foreign Key (The link between tables).
- **PK**: Primary Key (Unique ID).

---

## 2. Diagram Summaries

### **USE_CASE_DIAGRAM.puml**
- **Primary Actor**: Recruiter/Admin.
- **Supporting Actor**: AI Bot (External System).
- **Core Logic**: Shows how the Recruiter initiates an upload, which triggers the AI Bot to parse and score.

### **CLASS_DIAGRAM.puml**
- **Clean Architecture Focus**: Visualizes how the `CandidateController` (Presentation) talks to `ProcessResumeUseCase` (Application), which then talks to `ICandidateRepository` (Domain Interface).
- **Patterns**: Highlights the **Factory** for parsers and **Strategy** for scoring.
 
### **ER_DIAGRAM.puml**
- **Multi-Tenancy**: Every table links back to the `Tenant` table.
- **Recruitment Flow**: Shows the chain from `Job` -> `PipelineTemplate` -> `PipelineStage` -> `Candidate`.

---

## 3. High-Mark Discussion Points
- **Crow's Foot Notation**: Explain that the "three-pronged" end of the line means "Many," and the "circle" means "Optional."
- **Interface Segregation**: Explain that we use dashed arrows to interfaces (`ICandidateRepository`) to keep the system decoupled (The "D" in SOLID).
