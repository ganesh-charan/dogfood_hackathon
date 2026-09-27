# JUDGING: Assignment Strategy, Scoring Math, and Normalization Engine Defended

## 1. Executive Premise

Traditional hackathon platforms converge on simple arithmetic mean scoring, which fails in competitive environments due to **judge variance**:
- A generous reviewer gives scores between 8 and 10 (mean = 9.0).
- A rigorous reviewer gives scores between 4 and 6 (mean = 5.0).
- An exceptional project reviewed solely by a strict judge gets eliminated, while an average project reviewed by a lenient judge advances.

This platform implements a **defensible, mathematically rigorous judging pipeline** enforcing role isolation, algorithmic distribution, and Z-Score variance compensation.

---

## 2. Reviewer Assignment Strategy

Reviewer assignments are orchestrated via `POST /api/judges/assign` using an algorithmic round-robin queue designed to satisfy three invariants:

1. **Uniform Coverage ($k$-Reviewer Guarantee)**:
   Every submitted project is assigned exactly $k$ independent reviewers (default $k = 3$).
2. **Balanced Workload**:
   Reviews are distributed cyclically across the judge pool to minimize load variance ($|L_a - L_b| \le 1$).
3. **Conflict of Interest (COI) Isolation**:
   Before confirming an assignment pair $(j, p)$, the assignment engine cross-references the candidate judge's email with all registered team members of project $p$:
   $$\text{COI}(j, p) = \text{email}(j) \in \bigcup_{m \in \text{members}(p)} \text{email}(m)$$
   If $\text{COI}(j, p) = \text{true}$, the candidate is rejected and the assignment advances to the next unbiased reviewer.

---

## 3. Weighted Scoring Rubric Math

Organizers define rubrics where criteria weights must sum to exactly **100%**:

$$\sum_{k=1}^m w_k = 1.00 \quad (\pm 0.001)$$

When a judge scores an evaluation across criteria $\{c_1, \dots, c_m\}$ with raw values $s_k \in [0, \text{maxScore}_k]$, the raw total score $S_{\text{raw}}$ is computed as:

$$S_{\text{raw}} = \sum_{k=1}^m (s_k \cdot w_k)$$

This prevents unweighted criteria skewing outcomes.

---

## 4. Backend-Enforced Role Isolation

Role isolation is non-bypassable and enforced at the server route level (`/api/judge/scores`):
- **Participants**: Any attempt to access judging scores yields `HTTP 403 Forbidden`.
- **Peer Scoring Shield**: If a judge requests evaluations using a peer's identifier (e.g. `GET /api/judge/scores?judge=judge_a` from `judge_b`), the backend inspects session credentials and denies access with `HTTP 403 Forbidden`.
- **Organizers**: Organizers hold global administrative visibility to monitor telemetry and progress.

---

## 5. Z-Score Statistical Normalization Defended

### 5.1 The Mathematical Model
To neutralize judge severity disparities, evaluations undergo standard score normalization:

For each judge $j$ who completed $n_j$ evaluations:
1. **Judge Mean ($\mu_j$)**:
   $$\mu_j = \frac{1}{n_j} \sum_{i=1}^{n_j} x_{ji}$$

2. **Judge Sample Standard Deviation ($\sigma_j$)**:
   $$\sigma_j = \sqrt{\frac{1}{n_j} \sum_{i=1}^{n_j} (x_{ji} - \mu_j)^2}$$

3. **Damped Variance Safeguard**:
   If a judge assigns identical scores to all projects, $\sigma_j \to 0$, which causes division-by-zero errors. To defend against this degenerate case, we apply a variance floor:
   $$\sigma_{\text{eff}} = \max(\sigma_j, 0.5)$$

4. **Standardized Z-Score**:
   $$z_{ji} = \frac{x_{ji} - \mu_j}{\sigma_{\text{eff}}}$$

5. **Scale Transformation to $[0, 100]$**:
   To present scores in an intuitive format for organizers and participants, $z$-scores are mapped with mean $\mu = 50$ and scale factor $\sigma = 15$:
   $$\text{Normalized Score} = \min\Big(100, \, \max\big(0, \, 50 + 15 \cdot z_{ji}\big)\Big)$$

### 5.2 Proof of Equivalence
Consider two projects $P_1$ and $P_2$:
- $P_1$ evaluated by harsh Judge A ($\mu = 5.0, \sigma = 1.0$), receiving score $6.0$.
  $$z = \frac{6.0 - 5.0}{1.0} = +1.0 \implies \text{Normalized} = 50 + 15(1.0) = 65.0$$
- $P_2$ evaluated by generous Judge B ($\mu = 8.0, \sigma = 1.0$), receiving score $9.0$.
  $$z = \frac{9.0 - 8.0}{1.0} = +1.0 \implies \text{Normalized} = 50 + 15(1.0) = 65.0$$

Both projects outperformed their respective judge's baseline by exactly 1 standard deviation, and both appropriately receive an identical normalized score of **65.0**, neutralizing scoring bias.
