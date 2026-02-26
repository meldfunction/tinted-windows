# LEGAL.md — Privacy Rights by Jurisdiction

**How to use this document:** These are the laws that give you the right to demand companies delete your data, disclose what they hold, stop selling it, and face consequences when they don't. pane's breach detection and alias burn events create timestamped, documented records that support all of these rights. This is not legal advice. For enforcement actions, consult a lawyer who specialises in privacy law in your jurisdiction.

---

## Quick reference

| Right | EU/EEA | United States | Canada | Mexico |
|-------|--------|--------------|--------|--------|
| Know what's collected | ✅ GDPR Art. 15 | ✅ CCPA (CA) · varies by state | ✅ PIPEDA | ✅ LFPDPPP |
| Delete your data | ✅ GDPR Art. 17 | ✅ CCPA (CA) · varies by state | ✅ PIPEDA | ✅ LFPDPPP |
| Opt out of sale | ✅ GDPR (consent basis) | ✅ CCPA (CA) · varies by state | ✅ PIPEDA | ✅ LFPDPPP |
| Correct inaccurate data | ✅ GDPR Art. 16 | Partial | ✅ PIPEDA | ✅ LFPDPPP |
| Data portability | ✅ GDPR Art. 20 | Limited | Limited | Limited |
| Object to profiling | ✅ GDPR Art. 21–22 | Limited | Limited | Limited |
| Breach notification (to you) | ✅ 72-hour to DPA · notified if high risk | Varies by state · no federal law | ✅ PIPEDA (real risk of harm) | ✅ LFPDPPP |
| Biometric data rights | ✅ GDPR Art. 9 (sensitive) | IL BIPA · TX · WA · varies | PIPEDA | LFPDPPP |

---

## European Union / EEA — GDPR

**General Data Protection Regulation** · Regulation (EU) 2016/679 · In force since May 25, 2018  
Applies to any organisation that processes data of EU/EEA residents, regardless of where the organisation is based.

### Your rights

**Article 15 — Right of access**  
You can request a copy of all personal data a company holds about you, the purposes they're processing it for, who they've shared it with, how long they'll keep it, and whether it's been transferred internationally. They must respond within **30 days**. No charge for the first request.

**Article 16 — Right to rectification**  
If data is inaccurate or incomplete, you can demand correction. 30-day response window.

**Article 17 — Right to erasure ("right to be forgotten")**  
You can demand deletion when:
- The data is no longer necessary for the original purpose
- You withdraw consent and there's no other legal basis
- You object to processing and there's no overriding legitimate interest
- The data was unlawfully processed
- Deletion is required by EU or member state law

**Companies must also tell anyone they've shared your data with to delete it** (Art. 17(2)). This is the chain-deletion right — relevant when a data broker has sold your profile downstream.

**Article 18 — Right to restriction**  
You can demand they stop *processing* (but not necessarily delete) while a dispute is resolved.

**Article 20 — Right to data portability**  
Receive your data in a machine-readable format. Transfer it to another provider.

**Article 21 — Right to object**  
Object to processing based on legitimate interests or public task — including **profiling**. The company must stop unless it can demonstrate compelling legitimate grounds that override your interests. For **direct marketing**, the right to object is absolute — no balancing test.

**Article 22 — Automated decision-making and profiling**  
You have the right not to be subject to decisions based solely on automated processing (including profiling) that produce legal or similarly significant effects. You can demand human review of automated decisions.

### How to exercise these rights

1. Submit a written request to the company's Data Protection Officer (DPO) — most large companies publish a DPO contact in their privacy policy
2. Identify yourself and specify the right you're invoking (e.g., "I am submitting a Subject Access Request under Article 15 of the GDPR")
3. They have **30 days** to respond; can extend to 60 days for complex requests with notice
4. If they fail to respond or refuse without valid grounds, escalate to your national Data Protection Authority

**National Data Protection Authorities:**
- 🇩🇪 Germany: BfDI — bfdi.bund.de
- 🇫🇷 France: CNIL — cnil.fr
- 🇮🇪 Ireland: DPC — dataprotection.ie (handles most US tech companies domiciled in Ireland)
- 🇳🇱 Netherlands: Autoriteit Persoonsgegevens — autoriteitpersoonsgegevens.nl
- 🇸🇪 Sweden: IMY — imy.se
- Full list: edpb.europa.eu/about-edpb/about-edpb/members_en

### Breach notification

Under **Article 33**, companies must notify their national DPA within **72 hours** of discovering a personal data breach. Under **Article 34**, they must notify *you directly* if the breach is likely to result in high risk to your rights and freedoms — and they must do so "without undue delay."

**If you discover a breach before they tell you** (e.g., your pane alias starts receiving targeted phishing or data-specific spam), you can:
1. File a complaint with your national DPA
2. Request confirmation of the breach under Art. 15
3. Pursue compensation under Art. 82 for material or non-material damage caused by the breach

### Sensitive data (Article 9)

The following categories receive enhanced protection and generally require **explicit consent** to process:
- Biometric data used for unique identification (face geometry, fingerprints)
- Health and medical data
- Genetic data
- Racial or ethnic origin
- Political opinions
- Religious or philosophical beliefs
- Trade union membership
- Sexual orientation

**Practical application:** Every KYC identity verification process (Persona, Jumio, Onfido) that collects a photo of your face for identification is processing biometric data under Art. 9. They require a lawful basis beyond legitimate interest — typically explicit consent or legal obligation. You have full deletion rights under Art. 17 after the purpose is fulfilled.

### Fines and enforcement

- Up to **€20 million or 4% of global annual turnover**, whichever is higher, for serious violations
- Up to **€10 million or 2% of global turnover** for procedural violations
- Notable: Meta — €1.2B (2023), Amazon — €746M (2021), WhatsApp — €225M (2021)

---

## United States

The US has no comprehensive federal privacy law as of 2025. Rights vary significantly by state. The following covers the most significant laws.

---

### California — CCPA / CPRA

**California Consumer Privacy Act** (2018) + **California Privacy Rights Act** (2020 amendment)  
Enforced by the **California Privacy Protection Agency (CPPA)** and the California AG.

Applies to for-profit businesses that do business in California AND meet one of:
- Annual gross revenue > $25 million
- Buy/sell/share personal info of 100,000+ consumers or households annually
- Derive 50%+ of annual revenue from selling personal info

#### Your rights

**Right to know (§1798.100)**  
Request disclosure of: categories collected, sources, business/commercial purpose, third parties shared with, and specific pieces of data held about you. Free, twice per 12-month period.

**Right to delete (§1798.105)**  
Request deletion of personal information. **Applies to:**
- The business you request from
- Service providers they've shared it with
- Third parties they've sold/disclosed it to

**This is the operative right for data broker removal and KYC vendor deletion.** Persona, Jumio, Onfido, Clearview AI, Spokeo, Acxiom — all subject to CCPA deletion requests if they do business with California residents, regardless of where you live (they're covered by the law, meaning the right travels with data about CA residents).

**Right to opt out of sale/sharing (§1798.120)**  
Any business selling or sharing personal info must provide a "Do Not Sell or Share My Personal Information" link. Opt-out is permanent until you explicitly opt back in.

**Right to correct (§1798.106)**  
Correct inaccurate personal information.

**Right to limit use of sensitive personal information (§1798.121)**  
Sensitive PI includes: SSN, financial account data, precise geolocation, racial/ethnic origin, religious beliefs, union membership, personal communications content, genetic data, health/sex life data, **and biometric data used for identification**.

**Right to non-discrimination (§1798.125)**  
Companies cannot deny service, charge different prices, or provide a different quality of service because you exercised a CCPA right.

#### How to exercise

1. Use the company's designated privacy request form or email (required by law to have one)
2. Or submit via: privacyrequests@[company].com (common format)
3. They have **45 days** to respond; can extend 45 more days with notice
4. If denied or ignored: file a complaint at cppa.ca.gov or oag.ca.gov

**Template deletion request:**
```
To: [company DPO / privacy team]
Subject: CCPA Deletion Request — §1798.105

I am a California resident and am submitting this request under the California 
Consumer Privacy Act (Cal. Civ. Code §1798.105) for deletion of all personal 
information you hold about me.

This request extends to:
- All personal information held directly
- All service providers and contractors you have shared my data with
- All third parties to whom you have sold or disclosed my data

Please confirm in writing: (1) that deletion has been completed, (2) the 
categories of information deleted, and (3) the names of any third parties 
notified of the deletion request.

Full name: [name]
Email addresses on file: [list]
[Any other identifying information]
```

#### CCPA + biometrics specifically

Biometric data — including face geometry from identity verification — is **sensitive personal information** under §1798.121. Clearview AI, PimEyes, and every KYC vendor processing your biometrics is covered if they do business in California.

**For Clearview AI specifically:** They reached settlements with several state AGs (Vermont, Illinois, others). A CCPA deletion request has teeth.

#### Enforcement

- Civil penalties: **$2,500 per unintentional violation**, **$7,500 per intentional violation**
- Private right of action for data breaches: **$100–$750 per consumer per incident** (or actual damages)
- File at: cppa.ca.gov/consumers/

---

### Illinois — BIPA

**Biometric Information Privacy Act** · 740 ILCS 14 · One of the strongest biometric laws in the US

Applies to any private entity collecting biometric identifiers (fingerprints, retina/iris scans, voiceprints, face geometry, hand scans) from Illinois residents.

**Key provisions:**
- Must obtain written consent *before* collecting biometrics
- Must publish a publicly available retention/destruction policy
- Cannot sell, lease, trade, or profit from biometric data
- Must destroy biometrics within 3 years or when the purpose is fulfilled
- Cannot disclose without consent

**Private right of action (§20):**  
- **$1,000 per negligent violation** (or actual damages, whichever is greater)
- **$5,000 per intentional or reckless violation** (or actual damages, whichever is greater)
- Plus attorney's fees

**Why BIPA matters for KYC:** The Illinois Supreme Court in *Cothron v. White Castle* (2023) held that a separate claim accrues each time a biometric identifier is collected or disclosed without consent — meaning per-scan, per-use liability. This is why companies like Clearview AI reached Illinois-specific settlements.

**If you're an Illinois resident** and a company collected your face geometry (including through a KYC vendor like Persona or Jumio) without obtaining prior written consent: you may have a BIPA claim. Consult a privacy attorney — BIPA litigation is active.

---

### Texas — CUBI

**Capture or Use of Biometric Identifier Act** · Tex. Bus. & Com. Code §503.001  
Similar to BIPA but enforced only by the Texas AG (no private right of action). **$25,000 per violation**.

---

### Washington — My Health MY Data Act (2023)

Covers health data including data inferred from non-health sources. Strict consent requirements. Private right of action.

---

### Other state laws in effect as of 2025

| State | Law | Effective |
|-------|-----|-----------|
| Colorado | CPA — Colorado Privacy Act | July 2023 |
| Connecticut | CTDPA | July 2023 |
| Virginia | CDPA | January 2023 |
| Utah | UCPA | December 2023 |
| Texas | TDPSA | July 2024 |
| Montana | MCDPA | October 2024 |
| Oregon | OCPA | July 2024 |
| Delaware | DPDPA | January 2025 |
| Iowa | ICDPA | January 2025 |
| Indiana | IDPL | January 2026 |
| Tennessee | TIPA | July 2025 |
| New Hampshire | NHPA | January 2025 |

Most of these grant rights similar to CCPA: access, deletion, correction, opt-out of sale/sharing, opt-out of targeted advertising. Enforcement mechanisms vary — some have private rights of action, most are AG-only.

**If you're not in California:** look up your state's AG website for the applicable privacy law. Most have online complaint portals.

---

### Federal laws (limited scope)

| Law | Covers |
|-----|--------|
| COPPA | Children under 13 — parental consent required, deletion rights |
| HIPAA | Protected health information from covered healthcare entities |
| FCRA | Credit reporting — right to dispute, access, opt-out of prescreened offers |
| GLBA | Financial institution customer data — limited disclosure rights |
| FERPA | Student education records |
| CAN-SPAM | Email marketing — opt-out rights |

**Notable gap:** There is no US federal equivalent to GDPR's right to erasure or right to object to profiling. Federal privacy legislation has been proposed (ADPPA) but has not passed as of 2025.

---

### Data broker specific — federal and state

**Vermont** requires data brokers to register with the state and disclose their data collection practices. This registry is publicly searchable.

**California** (CCPA §1798.140 and Data Broker Registration law) requires data brokers to register annually and honor deletion requests submitted through the California AG's [Data Broker Opt-Out Portal](https://www.oag.ca.gov/data-broker-opt-out).

**Reference:** [yaelwrites/Big-Ass-Data-Broker-Opt-Out-List](https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List) — 200+ data brokers with individual opt-out procedures, legal requirements per broker, and difficulty ratings. The single most useful resource for manual broker removal.

---

## Canada — PIPEDA + Bill C-27

### PIPEDA (current law)

**Personal Information Protection and Electronic Documents Act** · S.C. 2000, c. 5  
Applies to private-sector organisations collecting, using, or disclosing personal information in the course of commercial activities. Enforced by the **Office of the Privacy Commissioner of Canada (OPC)**.

**10 Fair Information Principles** (Schedule 1):

1. **Accountability** — organisation is responsible for PI under its control
2. **Identifying purposes** — must identify why PI is collected before or at time of collection
3. **Consent** — knowledge and consent required for collection, use, disclosure
4. **Limiting collection** — collect only what's necessary for identified purposes
5. **Limiting use, disclosure, retention** — use only for stated purposes; retain only as long as necessary
6. **Accuracy** — PI must be accurate, complete, up-to-date
7. **Safeguards** — appropriate security for sensitivity of information
8. **Openness** — policies and practices must be publicly available
9. **Individual access** — you can request what PI is held about you and challenge accuracy
10. **Challenging compliance** — you can challenge compliance with the OPC

**Your rights under PIPEDA:**
- Access to your personal information held by an organisation
- Correction of inaccurate information
- Withdrawal of consent (with reasonable notice) — organisation must then stop using/disclosing
- Know whether PI has been disclosed and to whom
- File a complaint with the OPC

**Breach notification (mandatory since November 2018):**  
Organisations must notify the OPC and affected individuals of breaches that create a "real risk of significant harm." Real risk is assessed against: sensitivity of PI, probability of misuse, number affected, systemic nature of the breach.

**Significant harm** includes: bodily harm, humiliation, damage to reputation/relationships, loss of employment/business/professional opportunities, financial loss, identity theft, negative effects on credit record, damage to/loss of property.

**How to exercise access rights:**
Write to the organisation's privacy officer (required to have one). They have **30 days** to respond. If they fail or refuse, file a complaint at priv.gc.ca.

**Complaint to OPC:** priv.gc.ca/en/report-a-concern/

---

### Bill C-27 — Consumer Privacy Protection Act (CPPA) (proposed)

As of 2025, Bill C-27 is working through Parliament. If passed, it would replace PIPEDA with significantly stronger rules including:

- Explicit right to deletion ("right to de-index")
- Stronger consent requirements — no consent by implication for sensitive data
- Right to data mobility (portability)
- Algorithmic transparency for automated decision-making with significant impact
- Fines up to **5% of global revenue or CAD $25 million**, whichever is greater
- Private right of action (proposed)

**Quebec is already ahead:** **Law 25 (Bill 64)** came into full effect September 2023 and gives Quebec residents GDPR-comparable rights including deletion, portability, right to be forgotten from search indexes, and mandatory Privacy Impact Assessments for high-risk processing. Fines up to **4% of worldwide turnover or CAD $25 million**.

---

### Provincial laws

| Province | Law | Scope |
|----------|-----|-------|
| Quebec | Law 25 / Act respecting the protection of personal information in the private sector | Full GDPR-comparable rights (2023) |
| Alberta | PIPA | Private sector PI — similar to PIPEDA |
| British Columbia | PIPA | Private sector PI — similar to PIPEDA |

---

## Mexico — LFPDPPP

**Ley Federal de Protección de Datos Personales en Posesión de los Particulares**  
Federal Law on Protection of Personal Data Held by Private Parties · In force since 2010  
Enforced by the **Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)** — inai.org.mx

Applies to private individuals and companies processing personal data of Mexican residents.

### Your rights — ARCO

Mexico's framework is built on four core rights known as **ARCO**:

**Acceso (Access)**  
Request what personal data is held about you, the processing purposes, and who it has been shared with. Free request once per year; company has **20 business days** to respond.

**Rectificación (Rectification)**  
Correct inaccurate or incomplete personal data. 20 business days for response.

**Cancelación (Cancellation / Erasure)**  
Request deletion of personal data when it is no longer necessary for the purpose collected, when consent is withdrawn, or when it has been used unlawfully. The data is placed in a **blocking period** before deletion — it cannot be used but must be retained for legal purposes, then erased. 20 business days for response.

**Oposición (Opposition)**  
Object to the processing of your personal data for specific purposes, including direct marketing and profiling.

### Sensitive data

Under Article 3(VI), sensitive personal data receives enhanced protection and includes:
- Racial or ethnic origin
- Present or future health status
- Genetic information
- Religious, philosophical, and moral beliefs
- Union membership
- Political opinions
- Sexual preference
- **Biometric data** (added by regulatory criteria — fingerprints, iris, face geometry)

Sensitive data requires **explicit written consent** (consentimiento expreso). General consent clauses are insufficient.

### Privacy notice (Aviso de privacidad)

Every organisation collecting personal data must provide a privacy notice (aviso de privacidad) specifying: identity and address of the data controller, purposes of processing, data transfer options, means for exercising ARCO rights. Failure to provide this notice is itself a violation.

### Breach notification

Article 20 of LFDPPP regulations: organisations must notify INAI and affected individuals of security breaches that "significantly affect" economic or moral rights. Notification must include: nature of the breach, personal data involved, corrective measures taken.

### How to exercise ARCO rights

1. Submit a written request to the organisation's data protection officer (responsable)
2. Include: name, address, description of the right to exercise, copy of ID, any other info to locate your data
3. **20 business days** to respond (can extend 20 more days for complex requests)
4. If refused or no response: file a complaint (Recurso de Revisión) at INAI — inai.org.mx/vut/

**INAI complaint portal:** inai.org.mx/vut/  
**Fines:** MXN 100–320 million for serious violations (approx. USD $5–16M)

---

## Cross-border data flows — who covers you where

| Scenario | Which law applies |
|----------|------------------|
| EU resident, data held by US company | GDPR — the company is subject to GDPR regardless of where it's based |
| Canadian resident, data held by Facebook (Ireland) | PIPEDA + GDPR (Facebook processes under GDPR) |
| California resident, data held by Clearview AI | CCPA + potentially BIPA (if IL resident) |
| Mexican resident, data held by LinkedIn | LFPDPPP — LinkedIn must honor ARCO requests |
| You're in one country, data broker is in another | GDPR/CCPA travel with your residency, not the company's location |

---

## Templates: key letters

### GDPR Subject Access Request (EU/EEA)

```
To: [Data Protection Officer / Privacy Team]
Re: Subject Access Request — Article 15 GDPR

I am writing to exercise my right of access under Article 15 of the General 
Data Protection Regulation (EU) 2016/679.

Please provide me with:
1. Confirmation of whether you process personal data concerning me
2. A copy of all personal data you hold about me
3. The purposes for which it is processed
4. The categories of personal data concerned
5. The recipients or categories of recipient to whom it has been disclosed
6. The envisaged retention period
7. Whether my data has been transferred to a third country or international 
   organisation, and the safeguards in place
8. The source of my data (if not collected directly from me)

I am attaching [copy of ID] to verify my identity.

You are required to respond within one month of receipt of this request.

[Name, Address, Email]
```

### GDPR Erasure Request (EU/EEA)

```
To: [Data Protection Officer / Privacy Team]
Re: Request for Erasure — Article 17 GDPR

I am exercising my right to erasure under Article 17 GDPR. The grounds for 
this request are: [select applicable]

☐ The personal data are no longer necessary in relation to the purposes for 
  which they were collected
☐ I withdraw the consent on which processing was based and there is no other 
  legal ground for the processing
☐ I object to the processing pursuant to Article 21 and there are no 
  overriding legitimate grounds
☐ The personal data have been unlawfully processed

Please confirm in writing:
1. That all personal data concerning me has been erased
2. That you have notified all recipients to whom the data was disclosed 
   (Article 17(2)) — please provide the names of those recipients

[Name, Address, Email, Date]
```

### CCPA Deletion Request (California)

```
To: [Privacy Team / Legal]
Re: CCPA Deletion Request — Cal. Civ. Code §1798.105

I am a California resident and submit this request under the California 
Consumer Privacy Act, Cal. Civ. Code §1798.105, for deletion of all personal 
information you hold about me.

This request covers:
- All personal information held directly by your organisation
- All personal information shared with service providers and contractors
- All personal information sold or disclosed to third parties

Please respond within 45 days confirming:
(1) Deletion has been completed
(2) Categories of information deleted
(3) Names of third parties/service providers notified

I may be identified by: [name, email(s), address, phone, any account IDs]

[Name, Date]
```

### PIPEDA Access Request (Canada)

```
To: [Privacy Officer]
Re: Access Request — PIPEDA Principle 9

I am writing to request access to my personal information under Principle 9 
of the Personal Information Protection and Electronic Documents Act (PIPEDA).

Please provide:
1. All personal information held about me
2. The purposes for which it is being used
3. Third parties to whom it has been disclosed
4. The source of the information (where not obtained from me)

You have 30 days to respond. If you require more time, please notify me.

[Name, Addresses, Email, Date of Birth for identification]
```

### ARCO Request (Mexico)

```
A: [Responsable de datos personales / Oficial de privacidad]
Asunto: Ejercicio de Derechos ARCO — LFPDPPP

Con fundamento en la Ley Federal de Protección de Datos Personales en 
Posesión de los Particulares y su Reglamento, solicito el ejercicio del 
siguiente derecho:

☐ Acceso — copia de mis datos personales y finalidades del tratamiento
☐ Rectificación — corrección de datos inexactos (describa cuáles)
☐ Cancelación — supresión de mis datos personales
☐ Oposición — oposición al tratamiento para los fines siguientes: ___

Adjunto: copia de identificación oficial vigente.

Tiempo de respuesta: 20 días hábiles.

[Nombre completo, domicilio, correo electrónico, fecha]
```

---

## pane-specific legal applications

### When your alias gets breached

When pane detects a breach signal — an alias receiving unexpected mail from a third-party domain — you have a documented record: the alias name (identifies the source company), the unexpected sender, and the timestamp.

This record supports:
- **GDPR Art. 33/34 complaint** — if you're in the EU/EEA, file with your national DPA that the source company failed to disclose the breach
- **CCPA §1798.150** — California private right of action for data breaches resulting from failure to maintain reasonable security. $100–$750 per consumer per incident without having to prove actual harm
- **PIPEDA complaint to OPC** — real risk of significant harm threshold; spam and potential identity theft both qualify

### For Clearview AI / PimEyes removal

- **EU residents:** GDPR Art. 17 erasure request + Art. 9 (biometric sensitive data). File with your national DPA if they refuse.
- **California residents:** CCPA §1798.105 deletion + §1798.121 (sensitive PI — biometric). They've already settled with multiple state AGs.
- **Illinois residents:** BIPA — if they collected your biometric without consent, you have a private right of action. Consult a BIPA attorney.
- **All others:** Use their opt-out portals (Clearview: privacy@clearview.ai / PimEyes: pimeyes.com/en/opt-out). Document each request with date and confirmation number.

### For KYC vendor deletion (Persona, Jumio, Onfido)

Every time you complete a KYC identity verification on any platform, file a deletion request with the vendor directly. They are separate data controllers from the platform that sent you to them.

- Persona: privacy@withpersona.com · CCPA and GDPR deletion
- Jumio: privacy@jumio.com · GDPR erasure + CCPA deletion
- Onfido: privacy@onfido.com · GDPR erasure + CCPA deletion

The grounds: processing purpose fulfilled (you completed the verification), no ongoing legitimate basis. They must delete within the statutory timeframe or provide specific grounds for refusal — which you can then escalate.

### Building a legal record with pane

Your alias burn log is evidence. For any claim under CCPA, GDPR, or PIPEDA involving an unauthorised data disclosure:

1. Export your context log — it shows: context name (= company), creation date, burn date, trigger (unexpected sender)
2. Document the unexpected sender details — domain, timestamp, subject line
3. Cross-reference with the source company's privacy policy — what did they say they'd do with your data?
4. This paper trail strengthens: regulatory complaints, AG submissions, class action participation

---

*This document is a plain-language reference, not legal advice. Laws change. For enforcement actions, contact a privacy attorney in your jurisdiction. EU residents: edpb.europa.eu has guidance on your specific national DPA. US residents: iapp.org and the Electronic Frontier Foundation (eff.org) publish updated state law trackers.*

---

*Last updated: 2025 · Covers laws in effect or substantially in effect as of publication date · Bill C-27 (Canada) pending*
