# 🎨 VinciFlow — AI-Powered Brand Content Automation Platform

**Production-grade serverless content pipeline built with AWS Step Functions, Bedrock, Lambda, Cognito, Meta Graph API, and Terraform**

![AWS Step Functions](https://img.shields.io/badge/AWS%20Step%20Functions-FF9900?style=flat&logo=amazonaws&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-FF9900?style=flat&logo=awslambda&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=flat&logo=amazondynamodb&logoColor=white)
![S3](https://img.shields.io/badge/S3-569A31?style=flat&logo=amazons3&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-FF9900?style=flat&logo=amazonaws&logoColor=white)
![Cognito](https://img.shields.io/badge/Cognito-DD344C?style=flat&logo=amazonaws&logoColor=white)
![EventBridge](https://img.shields.io/badge/EventBridge-FF4F8B?style=flat&logo=amazonaws&logoColor=white)
![Meta](https://img.shields.io/badge/Meta%20Graph%20API-0866FF?style=flat&logo=meta&logoColor=white)

---

## Live Deployments

✅ **Dev** : [Click Here](https://dev.d8aheoykcvs8k.amplifyapp.com)

✅ **Prod** : [Click Here](https://main.d8aheoykcvs8k.amplifyapp.com)

---

## 📋 Table of Contents

- [What Makes VinciFlow Different](#what-makes-vinciflow-different)
- [System Architecture](#system-architecture)
- [Infrastructure Highlights](#infrastructure-highlights)
  - [1. Multi-Environment Terraform Architecture](#1-multi-environment-terraform-architecture)
  - [2. Authentication System (AWS Cognito)](#2-authentication-system-aws-cognito)
  - [3. AI Layer (Bedrock Agent + Nova Lite)](#3-ai-layer-bedrock-agent--nova-lite)
  - [4. Backend (AWS Lambda — Docker/ECR)](#4-backend-aws-lambda--dockerecr)
  - [5. Workflow Orchestration (AWS Step Functions)](#5-workflow-orchestration-aws-step-functions)
  - [6. Scheduling & Publishing (EventBridge + Meta Graph API)](#6-scheduling--publishing-eventbridge--meta-graph-api)
  - [7. API Gateway (HTTP API)](#7-api-gateway-http-api)
  - [8. Frontend (React + AWS Amplify)](#8-frontend-react--aws-amplify)
- [Project Status](#project-status)
- [Tech Stack](#tech-stack)
- [Key Technical Achievements](#key-technical-achievements)
- [Engineering Philosophy](#engineering-philosophy)
- [Roadmap](#roadmap)
- [Author](#author)

---

## What Makes VinciFlow Different

This isn't a chatbot demo. VinciFlow is a full-stack, production-grade **Brand Content Automation Platform** where:

- AI handles **creativity** — caption generation, image prompts, intent parsing
- Deterministic cloud infrastructure handles **execution** — scheduling, publishing, retries

Most social media tools fall into one of two traps:

| Approach | Problem |
|----------|---------|
| Manual-heavy tools | Too much human effort required |
| Fully autonomous AI | Unreliable, unsafe, hard to control |

VinciFlow takes a third path — **AI as an intelligence plane, cloud as a control plane.**

Key differentiators:

- **Brand Aura System** — Each user defines a persistent brand identity (tone, colors, industry, logo) stored in DynamoDB. Every AI call is injected with this context automatically, producing brand-consistent content without re-prompting.
- **Deterministic Batch Pipeline** — Content generation is orchestrated by AWS Step Functions with a Map State, not ad-hoc Lambda chaining. Every step is auditable, retryable, and observable.
- **Full Publishing Lifecycle** — Posts move through `DRAFT → SCHEDULED → POSTED / FAILED` states, with EventBridge Scheduler triggering exact-time publishing via Meta Graph API.
- **OAuth PKCE with Token Rotation** — Secure social media authentication with lazy refresh strategy — tokens are renewed only on 401, not proactively on every request.
- **Docker-Based Lambda** — Heavy AI dependencies (Bedrock, Gemini, Requests) are packaged in a Docker image pushed to Amazon ECR, eliminating cold start and package size issues from large ZIP deployments.
- **Infrastructure as Code** — 100% Terraform-managed, multi-environment (dev/prod) with reusable modules and centralized IAM.

---

## System Architecture

VinciFlow follows a strict three-plane architecture where AI and infrastructure have no overlap:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                   React + TypeScript + Tailwind                 │
│        [Login] → [Onboarding] → [Chat] → [Draft Preview]       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS + JWT Token
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Amazon API Gateway (HTTP)                      │
│    ┌──────────────┬──────────────┬──────────────────────┐      │
│    │ OPTIONS      │ POST /       │ GET /brand           │      │
│    │ (Public)     │ (JWT Auth)   │ (JWT Auth)           │      │
│    └──────────────┴──────────────┴──────────────────────┘      │
└──────────┬──────────────────────────────────────────────────────┘
           │ Cognito JWT Authorizer
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   AWS Lambda (Docker/ECR)                         │
│                   vinciflow-{env}-ai-agent                        │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Route Handler                                          │   │
│   │  ├── /brand (GET/POST)   → Brand Aura CRUD             │   │
│   │  ├── /auth/x             → X OAuth PKCE Flow           │   │
│   │  ├── / (POST)            → Chat + SFN Trigger          │   │
│   │  └── / (GET)             → Chat History                │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────┬────────────────────┬─────────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌────────────────────────────────────────────┐
│  Amazon Bedrock  │  │       AWS Step Functions                   │
│  Agent           │  │       (Batch Content Pipeline)             │
│  (Nova Lite)     │  │                                            │
│                  │  │  ┌─────────────────────────────────────┐  │
│  Context-aware   │  │  │  Map State (parallel post gen)      │  │
│  brand prompts   │  │  │  ├── PARSE: Extract topic/count     │  │
│                  │  │  │  ├── GENERATE: Caption + Image      │  │
│  Multimodal:     │  │  │  ├── BRAND: Apply Aura context      │  │
│  ├── PDF docs    │  │  │  └── STORE: DynamoDB + S3           │  │
│  └── Images      │  │  └─────────────────────────────────────┘  │
└──────────────────┘  └────────────────────────────────────────────┘
           │                    │
           └──────────┬─────────┘
                      ▼
        ┌─────────────────────────────┐
        │       Amazon DynamoDB       │
        │  MemoryTable: Chat history  │
        │  BrandsTable: Aura + Tokens │
        └─────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   EventBridge Scheduler     │
        │   (IST-aware cron jobs)     │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │   Meta Graph API            │
        │   Instagram Publishing      │
        │   (OAuth PKCE + Token       │
        │    Rotation)                │
        └─────────────────────────────┘
```

---

## Infrastructure Highlights

### 1. Multi-Environment Terraform Architecture

The entire infrastructure is organized into reusable Terraform modules with fully isolated dev and prod environments:

```
VinciFlow/
│
├── backend/
│   ├── src/
│   │   ├── handler.py              # Main Lambda handler (all routes)
│   │   └── requirements.txt
│   │
│   └── infra/
│       ├── envs/
│       │   ├── dev/
│       │   │   ├── main.tf         # Module wiring for dev
│       │   │   ├── outputs.tf
│       │   │   ├── provider.tf
│       │   │   ├── terraform.tfstate
│       │   │   ├── terraform.tfvars
│       │   │   └── variables.tf
│       │   └── prod/
│       │       └── ...             # Identical structure, isolated state
│       │
│       └── modules/
│           ├── api_gateway/        # HTTP API + JWT routes + CORS
│           │   ├── main.tf
│           │   ├── outputs.tf
│           │   └── variables.tf
│           ├── bedrock_agent/      # Bedrock Agent + alias + IAM
│           ├── cognito/            # User Pool + App Client
│           ├── dynamodb/           # MemoryTable + BrandsTable
│           ├── iam/                # Centralized IAM roles + policies
│           ├── lambda/             # ECR repo + Docker build + Function
│           │   ├── Dockerfile
│           │   ├── build_lambda.ps1
│           │   ├── main.tf
│           │   ├── outputs.tf
│           │   └── variables.tf
│           ├── step_functions/     # State machine definition
│           └── s3/                 # Media asset storage
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── AuthPage.tsx
    │   │   │   ├── Onboarding.tsx
    │   │   │   └── ConnectX.tsx
    │   │   ├── ChatPage.tsx
    │   │   └── LandingPage.tsx
    │   └── services/
    │       ├── api.tsx
    │       └── brandApi.tsx
    └── vite.config.ts
```

Key architecture decisions:

- **Environment Isolation** — Separate Terraform state files for dev and prod prevent cross-environment accidents
- **DRY Principle** — All infrastructure logic lives in reusable modules; envs only contain wiring and variable values
- **Centralized IAM** — A single IAM module owns all roles and outputs ARNs to consumers, preventing duplicate role conflicts
- **SSM Bridge Pattern** — Step Functions ARN is stored in SSM Parameter Store at deploy time and fetched by Lambda at runtime, breaking circular Terraform dependencies without sacrificing runtime connectivity
- **Docker Lambda** — Lambda is packaged as a container image via ECR rather than ZIP, cleanly supporting heavy ML/AI dependencies

---

### 2. Authentication System (AWS Cognito)

Implemented:

- Email/Password authentication with OTP verification
- JWT-based API authorization via API Gateway JWT Authorizer
- OAuth 2.0 with PKCE for both X (Twitter) and Meta (Instagram) social connections
- Secure token storage in DynamoDB BrandsTable — never in environment variables or code
- Lazy token refresh strategy — access tokens renewed only on 401, not proactively
- Single-use refresh token rotation — new refresh token issued and stored on every rotation cycle

Challenges Solved:

- **X OAuth Redirect URI Mismatch** — Byte-level differences between portal registration and backend variable caused silent auth failures. Fixed by byte-for-byte URI synchronization including the `/chat` path segment that was being silently stripped.
- **Meta Tester Invite Limbo** — Meta API returned `Insufficient Role` even after completing OAuth. Root cause: testers must manually accept invitations via Instagram Settings → Notifications → Tester Invites. Documented as a required prerequisite and added verification to onboarding flow.
- **X Token Expiry** — X access tokens expire after 2 hours. Implemented full token rotation: detect 401, use refresh token to get new access + refresh pair, update DynamoDB atomically, retry original request transparently.

---

### 3. AI Layer (Bedrock Agent + Nova Lite)

Configuration:

- **Model** — Amazon Nova Lite (optimized for speed and cost at scale)
- **Orchestration** — Custom system prompt injected per request with brand context (name, industry, tone)
- **Memory** — Last 5 conversations fetched from DynamoDB and prepended to each prompt for continuity
- **Multimodal** — Supports PDF documents and images via `bedrock-runtime.converse` with Nova Lite

Brand Context Injection Pattern:

```python
injected_prompt = f"[SYSTEM: Act as {b_name} ({b_industry}) with {b_tone} tone] {user_prompt}"

response = agent_client.invoke_agent(
    agentId=AGENT_ID,
    agentAliasId=AGENT_ALIAS_ID,
    sessionId=session_id,
    inputText=injected_prompt,
    sessionState={
        'sessionAttributes': {
            'brandContext': json.dumps({
                "BrandName": b_name,
                "Industry": b_industry,
                "Tone": b_tone
            })
        }
    }
)
```

Challenges Solved:

- **Bedrock Model Timeout** — Complex reasoning requests exceeded Lambda timeout, returning `dependencyFailedException`. Fixed by increasing Boto3 `read_timeout` to 120s and raising Lambda timeout to accommodate full inference cycles.
- **Stream Crash** — Rewrote handler to properly iterate over Bedrock Agent's chunked event stream using generator pattern instead of expecting a single JSON body.
- **Multimodal Routing** — PDF and image requests route to `bedrock-runtime.converse` with Nova Lite directly, bypassing the agent for cleaner document analysis. Text-only requests go through the full agent pipeline.

---

### 4. Backend (AWS Lambda — Docker/ECR)

The entire backend is a single Docker-based Lambda function that handles all routing internally:

Route Map:

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| OPTIONS | `/*` | CORS preflight | None |
| GET | `/brand` | Fetch brand profile | JWT |
| POST | `/brand` | Save brand profile | JWT |
| GET | `/auth/x` | Generate X OAuth URL | JWT |
| POST | `/auth/x/callback` | Exchange X auth code | JWT |
| GET | `/` | Chat history | JWT |
| POST | `/` | Chat + SFN trigger | JWT |

Lambda Capabilities:

- **Dynamic CORS** — Origin validated against allowlist; matching origin returned in response header (not wildcard) to support `credentials: true`
- **SFN Intent Detection** — Prompt keyword matching (`create`, `generate`, `post`) combined with digit detection triggers Step Functions pipeline instead of direct Bedrock call
- **Brand Context Fetching** — Every chat POST fetches brand profile from DynamoDB and injects it into the AI prompt before invocation
- **DecimalEncoder** — Custom JSON encoder handles DynamoDB Decimal type in responses without crashing serialization
- **SSM Late Binding** — Step Functions ARN fetched from SSM at runtime to avoid Terraform circular dependency

Docker Build Strategy:

```dockerfile
FROM public.ecr.aws/lambda/python:3.11
COPY requirements.txt .
RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
COPY src/handler.py ${LAMBDA_TASK_ROOT}
CMD ["handler.handler"]
```

Challenges Solved:

- **KMS AccessDeniedException** — Lambda execution role lacked `kms:Decrypt` permission for the customer-managed KMS key encrypting environment variables. Fixed by adding KMS policy to centralized IAM module.
- **Duplicate IAM Role Conflict** — Adding Step Functions module created a second IAM role alongside the original, both targeting the same name. Lambda was silently attached to the wrong role. Fixed by centralizing all IAM in a single module and passing the role ARN via variable.
- **Terraform Role Reference Error** — Lambda `main.tf` referenced `aws_iam_role.lambda_role.arn` which didn't exist in that module's scope. Fixed by using `var.iam_role_arn` passed from the IAM module output.

---

### 5. Workflow Orchestration (AWS Step Functions)

Why Step Functions instead of chained Lambdas?

| Problem with Lambda Chaining | Step Functions Solution |
|------------------------------|------------------------|
| Hard to debug spaghetti logic | Visual execution graph in AWS Console |
| No built-in retry on failure | Configurable retry + catch per state |
| No parallel execution | Map State for batch post generation |
| No execution history | Full execution trace per run |
| Tight coupling between functions | Clean state input/output boundaries |

Pipeline Definition:

```
User Prompt: "Create 3 posts for my brand this week"
         │
         ▼
    PARSE State
    └── Nova Lite extracts: topic, count, schedule intent
         │
         ▼
    Map State (runs N times in parallel)
    ├── GENERATE: Caption + image prompt per post
    ├── BRAND: Apply tone, colors, brand name
    └── STORE: Save draft to DynamoDB + S3
         │
         ▼
    NOTIFY State
    └── Return draft list to frontend
```

Trigger Logic in Lambda:

```python
keywords = ["create", "generate", "post", "posts"]
if any(w in user_prompt.lower() for w in keywords) and any(c.isdigit() for c in user_prompt):
    sfn_arn = get_state_machine_arn()  # Late-bound from SSM
    sfn_client.start_execution(
        stateMachineArn=sfn_arn,
        name=f"VF-{uuid.uuid4().hex[:8]}-{int(time.time())}",
        input=json.dumps(sfn_input)
    )
    return {'statusCode': 202, 'body': json.dumps({'message': 'Pipeline Started'})}
```

Challenges Solved:

- **Circular Terraform Dependency** — Lambda needed Step Functions ARN as env variable; Step Functions needed Lambda ARNs for state machine definition. Broke the cycle using SSM Parameter Store as a runtime bridge — SFN ARN written to SSM post-deploy, Lambda fetches it at invocation time.

---

### 6. Scheduling & Publishing (EventBridge + Meta Graph API)

Publishing Pipeline:

```
User assigns date to draft
         │
         ▼
EventBridge Scheduler creates cron rule
(ScheduleExpressionTimezone="Asia/Kolkata")
         │
         ▼  [at exact scheduled time]
Publishing Lambda triggered
         │
         ├── Fetch post data from DynamoDB
         ├── Fetch Meta access token from BrandsTable
         ├── Check token expiry → rotate if needed
         ├── Call Meta Graph API: /me/media (create container)
         ├── Call Meta Graph API: /me/media_publish (publish)
         └── Update post status: POSTED / FAILED
```

Meta Graph API Integration:

- **Container + Publish two-step flow** — Meta requires creating a media container first, then publishing it in a separate call
- **Long-lived Page tokens** — User tokens exchanged for long-lived Page access tokens at connection time, valid for 60 days
- **Token Rotation** — On 401, refresh token used to obtain new access + refresh pair, both updated in DynamoDB atomically
- **IST Timezone Scheduling** — `ScheduleExpressionTimezone="Asia/Kolkata"` set explicitly on all scheduler resources

Challenges Solved:

- **X API 402 Payment Required** — X free tier caps at 1,500 tweets/month. Hit this limit during testing. Pivoted architecture to Meta Graph API — better fit for brand marketing and Instagram's visual content model.
- **EventBridge UTC Offset** — Posts scheduled for 10:00 AM IST were publishing at 4:30 PM IST. Fixed by setting explicit timezone on all scheduler resources.
- **Meta Insufficient Role** — API calls returned `Insufficient Role` after completing OAuth. Root cause: test users must manually accept app invitations in Instagram settings. Added prerequisite verification to onboarding flow.

---

### 7. API Gateway (HTTP API)

Security Strategy:

- `OPTIONS /*` — No auth, handled by Lambda, returns CORS headers immediately
- `GET/POST /*` — JWT Authorizer validates Cognito token before Lambda invocation
- Dynamic origin CORS — Lambda validates request origin against allowlist and mirrors the matching origin back, enabling `credentials: true` (required for Cognito JWT)

Route Configuration in Terraform:

```hcl
# Preflight — no auth
resource "aws_apigatewayv2_route" "options_proxy" {
  route_key          = "OPTIONS /{proxy+}"
  authorization_type = "NONE"
}

# Protected routes — JWT required
resource "aws_apigatewayv2_route" "chat_post" {
  route_key          = "POST /"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
```

Challenges Solved:

- **CORS + JWT Conflict** — Native `cors_configuration` block on the API conflicted with Lambda-handled CORS, causing double-processing and preflight failures. Fixed by removing native CORS config and handling it entirely in Lambda.
- **OPTIONS Returning 500** — Preflight reached Lambda but returned 500 because the execution role lacked KMS decrypt permission, crashing the container at startup before any routing logic ran.
- **Invalid Issuer 400** — Cognito JWT authorizer returned `Invalid Issuer` on first deploy. Root cause: whitespace in `cognito_user_pool_id` Terraform variable. Fixed with `trimspace()`.

---

### 8. Frontend (React + AWS Amplify)

Tech Stack:

- React 18 + TypeScript (type-safe development)
- Vite (fast HMR and optimized builds)
- Tailwind CSS (utility-first styling)
- AWS Amplify Hosting (CI/CD pipeline with auto-deployment on git push)

UI/UX Features:

- 🎨 **Brand Onboarding Flow** — Structured multi-step form capturing brand name, industry, tone, logo, colors, and platform selection
- 💬 **Chat Interface** — Auto-scrolling message feed with session management and history sidebar
- 📂 **Session Sidebar** — Grouped by session with timestamps, resume previous conversations
- 🔐 **Protected Routes** — Automatic redirect to login for unauthenticated users
- 📱 **Responsive Design** — Mobile-first layouts with touch-optimized interactions
- ⚡ **Optimistic UI** — Immediate feedback on message send before API response returns

---

## Project Status

| Component | Status | Description |
|-----------|--------|-------------|
| Terraform Infrastructure | ✅ Production | Multi-environment (dev/prod) with reusable modules |
| Authentication (Cognito) | ✅ Production | Email/Password + JWT authorization |
| API Gateway (HTTP) | ✅ Production | CORS + JWT Auth + dynamic origin |
| Lambda (Docker/ECR) | ✅ Production | All routes in single containerized handler |
| Brand Aura System | ✅ Production | DynamoDB-backed brand identity per user |
| Bedrock Agent | ✅ Production | Nova Lite with brand context injection |
| Multimodal (PDF/Image) | ✅ Working | Document and image analysis via Nova Lite |
| Step Functions Pipeline | ✅ Production | Batch content generation with Map State |
| EventBridge Scheduler | ✅ Production | IST-aware exact-time publishing |
| Meta Graph API | ✅ Working | Instagram publishing with token rotation |
| X OAuth PKCE | ✅ Working | Token rotation implemented |
| Chat History (DynamoDB) | ✅ Production | Session-based with sidebar integration |
| Frontend (React) | ✅ Production | Deployed on Amplify with CI/CD |
| Knowledge Base (RAG) | 🚧 Planned | S3 + Bedrock Knowledge Base |
| Multi-Agent Orchestration | 🚧 Planned | Agent-to-agent collaboration |
| Engagement Analytics | 🚧 Planned | Post performance tracking |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | Type-safe UI framework |
| Tailwind CSS | Utility-first styling |
| Vite | Fast build tool and dev server |
| AWS Amplify Hosting | CI/CD + global CDN hosting |

### Backend & Cloud (AWS)

| Service | Role |
|---------|------|
| AWS Lambda (Docker/ECR) | Serverless compute — containerized handler |
| AWS Step Functions | Batch workflow orchestration with Map State |
| AWS EventBridge Scheduler | Exact-time post scheduling with IST support |
| AWS API Gateway (HTTP) | Secure API layer with JWT auth |
| AWS DynamoDB | Chat history (MemoryTable) + brand profiles (BrandsTable) |
| Amazon S3 | Media asset storage |
| AWS Cognito | User authentication + JWT issuance |
| Amazon ECR | Container registry for Lambda Docker image |
| AWS SSM Parameter Store | Runtime ARN binding (breaks Terraform cycles) |
| Amazon Bedrock (Nova Lite) | LLM + Agent orchestration |

### External APIs

| API | Role |
|-----|------|
| Meta Graph API | Instagram content publishing |
| X (Twitter) API v2 | Tweet publishing (OAuth PKCE) |
| Google Gemini | Caption + image prompt generation |

### Infrastructure as Code

| Tool | Role |
|------|------|
| Terraform | Full infrastructure provisioning |
| Docker | Lambda container build + ECR push |
| PowerShell | Local build automation scripts |

---

## Key Technical Achievements

### 1. Solved the Terraform Circular Dependency with SSM Bridge

**Problem:** Lambda needed the Step Functions state machine ARN as an environment variable to trigger workflows. Step Functions needed the Lambda function ARNs in its state machine definition. This created a hard circular dependency — neither module could be created first.

**Root Cause:** Direct Terraform resource references between `module.lambda` and `module.step_functions` created a dependency loop with no valid resolution order.

**Solution:** Implemented an SSM Parameter Store bridge as a late-binding strategy. Step Functions writes its ARN to SSM after creation. Lambda fetches the ARN from SSM at runtime, not at deploy time — breaking the Terraform cycle entirely.

```python
def get_state_machine_arn():
    param_path = f"/vinciflow/{ENV}/state_machine_arn"
    response = ssm_client.get_parameter(Name=param_path)
    return response['Parameter']['Value']
```

```hcl
resource "aws_ssm_parameter" "sfn_arn" {
  name  = "/vinciflow/${var.env}/state_machine_arn"
  type  = "String"
  value = module.step_functions.state_machine_arn
}
```

**Impact:** Enabled clean modular Terraform architecture without sacrificing runtime wiring. Pattern is reusable for any cross-module ARN dependency.

---

### 2. Diagnosed and Fixed a Three-Layer CORS + KMS Failure

**Problem:** All browser requests were blocked by CORS policy. OPTIONS preflight returned 500. The error `Response to preflight request doesn't pass access control check: It does not have HTTP ok status` gave no useful diagnostic information.

**Root Cause — Layer 1:** The `cors_configuration` block on `aws_apigatewayv2_api` conflicted with Lambda-handled CORS headers, causing double-header processing and breaking preflight.

**Root Cause — Layer 2:** Even after removing native CORS config, OPTIONS still returned 500. Lambda was crashing at container startup — before any routing logic ran — because the execution role lacked `kms:Decrypt` permission for the customer-managed KMS key encrypting environment variables.

**Root Cause — Layer 3 (true root cause):** The KMS issue existed because a duplicate IAM role conflict had been silently introduced when the Step Functions module was added. Lambda was attached to a role without KMS, CloudWatch, or SSM permissions. Two roles with the same name existed — the function was using the wrong one.

**Solution:**
1. Removed `cors_configuration` from API Gateway Terraform resource
2. Added `kms:Decrypt` + `kms:GenerateDataKey` to IAM policy
3. Centralized all IAM into a single module, eliminated the duplicate role
4. Lambda now uses `var.iam_role_arn` passed from IAM module output

**Impact:** Resolved a three-layer failure that surfaced as a single CORS error in the browser. Established clean IAM ownership pattern across all modules.

---

### 3. Implemented OAuth PKCE with Lazy Token Rotation

**Problem:** X API access tokens expire after 2 hours. On expiry every publish request returned `401 Unauthorized`, silently blocking the publishing pipeline.

**Root Cause:** Tokens stored statically in DynamoDB with no refresh mechanism. Long-lived sessions always hit expiry.

**Solution:** Implemented full lazy token rotation — detect 401, use refresh token to obtain new access + refresh pair, update DynamoDB atomically, retry original request transparently.

```python
def refresh_x_token(user_id, refresh_token, table):
    auth_header = base64.b64encode(
        f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()
    ).decode()
    resp = requests.post(
        "https://api.twitter.com/2/oauth2/token",
        headers={"Authorization": f"Basic {auth_header}"},
        data={"grant_type": "refresh_token", "refresh_token": refresh_token}
    )
    tokens = resp.json()
    table.update_item(
        Key={'UserId': user_id},
        UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt",
        ExpressionAttributeValues={
            ':at': tokens['access_token'],
            ':rt': tokens['refresh_token']
        }
    )
    return tokens['access_token']
```

**Impact:** Publishing pipeline became self-healing. Tokens renewed exactly when needed — no background jobs, no unnecessary API calls.

---

### 4. Pivoted from X to Meta Under Real Production Constraints

**Problem:** After completing full X API integration, production publishing started returning `402 Payment Required`. X free tier caps at 1,500 tweets/month — consumed during testing.

**Root Cause:** End-to-end testing exhausted the monthly quota before launch.

**Solution:** Pivoted to Meta Graph API (Instagram). Required rebuilding OAuth flow, implementing Meta's two-step container + publish API, exchanging short-lived user tokens for long-lived Page tokens, and updating the publishing Lambda and BrandsTable schema.

**Impact:** The pivot produced a better product — Instagram's visual content model is a stronger fit for brand marketing than X's text-centric feed. The architecture's clean separation of concerns meant the publishing adapter was swappable without touching orchestration or scheduling layers.

---

### 5. Fixed EventBridge IST Timezone Offset

**Problem:** Posts scheduled for 10:00 AM IST published at 4:30 PM IST — exactly 5 hours 30 minutes late.

**Root Cause:** EventBridge Scheduler defaults to UTC. IST times from the user were passed directly to cron expressions without timezone configuration.

**Solution:** Set `ScheduleExpressionTimezone="Asia/Kolkata"` on all scheduler resources.

```python
scheduler_client.create_schedule(
    Name=f"vinciflow-post-{post_id}",
    ScheduleExpression=f"cron({minute} {hour} {day} {month} ? {year})",
    ScheduleExpressionTimezone="Asia/Kolkata",
    Target={...},
    FlexibleTimeWindow={"Mode": "OFF"}
)
```

**Impact:** Scheduling is now exact. No mental UTC conversion required for users in India.

---

### 6. Resolved Duplicate IAM Role Conflict Across Terraform Modules

**Problem:** After adding the Step Functions module, Lambda invocations started failing with KMS errors. CloudWatch logs were inaccessible. The Lambda appeared to run under a role with no useful permissions.

**Root Cause:** The Step Functions module introduced its own `aws_iam_role` resource with the same name as the original Lambda module role. AWS silently used whichever was last applied. Lambda's `role` argument still referenced a resource name that didn't exist in its module scope.

**Solution:** Deleted all duplicate IAM resources. Created a single authoritative IAM module. Lambda receives `var.iam_role_arn` from the IAM module output. `envs/dev/main.tf` wires them: `iam_role_arn = module.iam.lambda_role_arn`.

**Impact:** Single source of truth for IAM. Any permission change happens in one place and propagates correctly.

---

### 7. Built Multimodal Brand Content Analysis

**Problem:** Brands needed to upload existing content (PDFs, images) for the AI to analyze and align new content with. Standard Bedrock Agent invocation doesn't support binary file inputs.

**Solution:** Implemented a routing split — file attachments route to `bedrock-runtime.converse` with Nova Lite directly, bypassing the agent:

```python
if file_obj:
    file_bytes = base64.b64decode(file_obj['data'])
    message_content = []
    if file_obj['type'] == 'application/pdf':
        message_content.append({
            "document": {"name": "doc", "format": "pdf",
                         "source": {"bytes": file_bytes}}
        })
    elif file_obj['type'].startswith('image/'):
        fmt = file_obj['type'].split('/')[-1].replace('jpg', 'jpeg')
        message_content.append({
            "image": {"format": fmt, "source": {"bytes": file_bytes}}
        })
    message_content.append({"text": f"{system_instr}\n\nUser: {user_prompt}"})
    response = bedrock_runtime.converse(
        modelId="us.amazon.nova-lite-v1:0",
        messages=[{"role": "user", "content": message_content}]
    )
```

**Impact:** Brands can upload style guides, existing campaigns, or product images and receive content that is visually and tonally consistent with their existing material.

---

## Engineering Philosophy

VinciFlow is built on principles directly aligned with the AWS Well-Architected Framework:

**Infrastructure is Code** — Every resource is Terraform-managed and version-controlled. No manual console changes.

**AI Stays in its Lane** — AI models generate content and parse intent. They never control credentials, call external APIs, or make scheduling decisions. The boundary is enforced architecturally, not by convention.

**Least Privilege by Default** — IAM policies grant only the minimum permissions required per function. Centralized IAM module makes this auditable.

**Stateless Compute** — Lambda functions are ephemeral. All state lives in DynamoDB or S3. Any invocation can fail and be retried without data corruption.

**Deterministic Orchestration** — Business workflows run through Step Functions, not ad-hoc code. Every execution is observable, retryable, and auditable.

**Fail Fast, Fail Gracefully** — Errors update post status to `FAILED` with reason codes. Nothing is silently dropped.

**Observable Systems** — CloudWatch logging on all Lambdas. Step Functions execution history provides full trace per workflow run.

---

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| Phase 1 | Brand onboarding + Bedrock chat | ✅ Complete |
| Phase 2 | Step Functions batch pipeline | ✅ Complete |
| Phase 3 | EventBridge scheduling + Meta publishing | ✅ Complete |
| Phase 4 | X OAuth PKCE + token rotation | ✅ Complete |
| Phase 5 | Multimodal PDF/image analysis | ✅ Complete |
| Phase 6 | Knowledge Base (RAG) with S3 + Bedrock | 🚧 In Progress |
| Phase 7 | Multi-platform publishing (LinkedIn, Threads) | 📋 Planned |
| Phase 8 | Engagement analytics + content optimization | 📋 Planned |
| Phase 9 | Multi-agent orchestration framework | 📋 Planned |
| Phase 10 | Festival-aware scheduling via calendar APIs | 📋 Planned |
| Phase 11 | Auto brand onboarding from existing social profiles | 📋 Planned |

---

## Academic Context

This project demonstrates applied knowledge of:

- Cloud-native system design and three-plane architecture separation
- Serverless and event-driven architecture patterns
- AI integration with production-grade guardrails and deterministic orchestration
- Secure credential management and OAuth lifecycle management
- Real-world API integration with failure handling and recovery
- Infrastructure as Code with multi-environment isolation

Suitable as a final-year B.Sc. Computer Science project, aligned with AWS Well-Architected Framework principles.

---

## Author

**Aditya Waghmare** — B.Sc. Computer Science · Cloud · Serverless · AI Automation

Building production-grade AI systems on AWS.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com)

---

## Project Highlights

VinciFlow demonstrates mastery of:

✅ Three-plane serverless architecture (Control + Intelligence + Data) on AWS  
✅ Deterministic workflow orchestration with Step Functions Map State  
✅ OAuth 2.0 PKCE for X and Meta with full token rotation lifecycle  
✅ Docker-based Lambda via ECR for heavy AI dependency management  
✅ EventBridge Scheduler with IST timezone for exact-time social publishing  
✅ Meta Graph API integration with container + publish two-step flow  
✅ Infrastructure as Code with Terraform modules and multi-environment isolation  
✅ Multimodal AI (PDF + image) via Amazon Nova Lite Converse API  
✅ Complex debugging across distributed systems (CORS, IAM, KMS, Terraform cycles)  
✅ Real production pivots under constraint (X quota → Meta Graph API migration)  

> VinciFlow is not a chatbot. It's a production-grade automation platform where AI assists creativity and backend infrastructure ensures reliability.

⭐ Star this repo if you found it useful!
