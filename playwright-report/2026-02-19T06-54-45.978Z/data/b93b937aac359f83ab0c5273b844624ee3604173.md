# Page snapshot

```yaml
- generic [ref=e3]:
  - banner
  - generic [ref=e5]:
    - generic [ref=e8]: Captcha is required
    - generic [ref=e11]:
      - generic [ref=e13]:
        - textbox "Email" [active] [ref=e14]: invalid@email.com
        - generic: Email
      - generic [ref=e17]:
        - textbox "Password" [ref=e18]
        - generic: Password
      - generic [ref=e21]:
        - img [ref=e23]
        - generic [ref=e25]:
          - textbox "CAPTCHA" [ref=e26]
          - generic: CAPTCHA
      - button "Sign In" [ref=e31] [cursor=pointer]
```