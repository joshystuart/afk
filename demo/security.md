`*/5 * * * *`

# Daily Security Audit Prompt

Review this codebase for meaningful security vulnerabilities and create a `SECURITY.md` report.

Focus on issues that could realistically lead to compromise, data exposure, privilege escalation, account takeover, remote code execution, SSRF, path traversal, injection, broken authorization, secret leakage, insecure defaults, unsafe deserialization, or missing validation around sensitive flows.

Guidelines:

- Prioritize real risk over style or minor best-practice nits.
- Highlight only major or moderate vulnerabilities worth fixing soon.
- Include file paths and the specific code pattern or flow that creates the risk.
- Explain impact clearly: what an attacker could do and under what conditions.
- Suggest a concrete remediation for each finding.
- If an area looks risky but you cannot prove exploitability, label it as `Needs verification`.
- If no major issues are found, say so explicitly and list the highest-risk areas reviewed.

Write `SECURITY.md` with your findings.

```md
# Security Review

## Summary

- Overall risk: Low / Medium / High
- Brief summary of the most important security concerns

## Findings

| Severity | Title | Location       | Impact |
| -------- | ----- | -------------- | ------ |
| High     | ...   | `path/to/file` | ...    |

## Detailed Notes

### [Severity] Finding title

- Location: `path/to/file`
- Issue: ...
- Why it matters: ...
- Recommended fix: ...

## Needs Verification

- Anything suspicious that needs manual confirmation

## Areas Reviewed

- Auth
- Input validation
- Secrets/config
- File/system access
- External requests
- Session/permission boundaries
```

Keep the report concise, evidence-based, and focused on the highest-value security findings.
