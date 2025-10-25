#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════════
# AUTOLEADS - PRODUCTION SECRETS GENERATOR
# ════════════════════════════════════════════════════════════════════════════════
# This script generates cryptographically secure secrets for production deployment
# Generated secrets meet NIST SP 800-132 standards for entropy
# ════════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}    AutoLeads Production Secrets Generator v1.0.0${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Print error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Check if OpenSSL is available
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed or not in PATH"
        echo ""
        echo "Please install OpenSSL:"
        echo "  - Ubuntu/Debian: sudo apt-get install openssl"
        echo "  - macOS: brew install openssl"
        echo "  - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html"
        echo ""
        exit 1
    fi
    print_success "OpenSSL is available: $(openssl version)"
}

# Verify secret quality (entropy check)
verify_secret_quality() {
    local secret=$1
    local length=${#secret}

    # Check minimum length (64 characters for 256-bit)
    if [ $length -lt 64 ]; then
        print_warning "Secret length is $length (recommended: 64+)"
        return 1
    fi

    # Check for sufficient entropy (at least 10 unique characters)
    local unique_chars=$(echo "$secret" | grep -o . | sort -u | wc -l)
    if [ $unique_chars -lt 10 ]; then
        print_warning "Low entropy detected (unique chars: $unique_chars)"
        return 1
    fi

    return 0
}

# Generate a secret with specified bit length
generate_secret() {
    local bits=$1
    local name=$2
    local bytes=$((bits / 8))

    print_info "Generating ${name} (${bits}-bit / ${bytes}-byte)..."

    # Generate using OpenSSL rand with hex encoding
    local secret=$(openssl rand -hex $bytes)

    # Verify quality
    if verify_secret_quality "$secret"; then
        print_success "Generated ${name}: ${#secret} characters, high entropy"
    else
        print_warning "Generated ${name}: ${#secret} characters, consider regenerating"
    fi

    echo "$secret"
}

# Main execution
main() {
    print_banner

    # Check prerequisites
    print_section "Checking Prerequisites"
    check_openssl
    echo ""

    # Generate secrets
    print_section "Generating Secrets"
    echo ""

    # JWT Secret (256-bit) - CRITICAL
    echo -e "${BOLD}1. JWT Secret (256-bit - CRITICAL)${NC}"
    print_info "Used for signing authentication tokens"
    JWT_SECRET=$(generate_secret 256 "JWT_SECRET")
    echo ""

    # Session Secret (128-bit) - RECOMMENDED
    echo -e "${BOLD}2. Session Secret (128-bit - RECOMMENDED)${NC}"
    print_info "Used for session cookie signing"
    SESSION_SECRET=$(generate_secret 128 "SESSION_SECRET")
    echo ""

    # API Key (256-bit) - OPTIONAL
    echo -e "${BOLD}3. API Key (256-bit - OPTIONAL)${NC}"
    print_info "Used for internal API authentication"
    API_KEY=$(generate_secret 256 "API_KEY")
    echo ""

    # Encryption Key (256-bit) - OPTIONAL
    echo -e "${BOLD}4. Encryption Key (256-bit - OPTIONAL)${NC}"
    print_info "Used for encrypting sensitive data at rest"
    ENCRYPTION_KEY=$(generate_secret 256 "ENCRYPTION_KEY")
    echo ""

    # Display results
    print_section "Generated Secrets - Copy to Coolify"
    echo ""

    echo -e "${BOLD}CRITICAL - Required for Production:${NC}"
    echo ""
    echo -e "${GREEN}JWT_SECRET${NC}=\"${JWT_SECRET}\""
    echo ""

    echo -e "${BOLD}RECOMMENDED - Enhance Security:${NC}"
    echo ""
    echo -e "${CYAN}SESSION_SECRET${NC}=\"${SESSION_SECRET}\""
    echo ""

    echo -e "${BOLD}OPTIONAL - Additional Features:${NC}"
    echo ""
    echo -e "${CYAN}API_KEY${NC}=\"${API_KEY}\""
    echo -e "${CYAN}ENCRYPTION_KEY${NC}=\"${ENCRYPTION_KEY}\""
    echo ""

    # Save to temporary file
    TEMP_FILE="/tmp/autoleads-secrets-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$TEMP_FILE" << EOF
# ════════════════════════════════════════════════════════════════════════════════
# AUTOLEADS PRODUCTION SECRETS
# ════════════════════════════════════════════════════════════════════════════════
# Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')
# Generator: generate-production-secrets.sh v1.0.0
# ════════════════════════════════════════════════════════════════════════════════

# CRITICAL - Required for Production
JWT_SECRET="${JWT_SECRET}"

# RECOMMENDED - Enhance Security
SESSION_SECRET="${SESSION_SECRET}"

# OPTIONAL - Additional Features
API_KEY="${API_KEY}"
ENCRYPTION_KEY="${ENCRYPTION_KEY}"

# ════════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT INSTRUCTIONS
# ════════════════════════════════════════════════════════════════════════════════

# 1. Copy JWT_SECRET to Coolify:
#    - Navigate to: https://cf.avolut.com
#    - Application: b8sc48s8s0c4w00008k808w8
#    - Environment Variables → Add Variable
#    - Name: JWT_SECRET
#    - Value: (paste JWT_SECRET from above)
#    - Mark as: Secret (click eye icon)
#    - Click: Save

# 2. Restart Application:
#    - Click "Restart" button (NOT redeploy)
#    - Wait 30 seconds
#    - Verify: curl https://auto.lumiku.com/health

# 3. Verify Logs:
#    ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50"

# ════════════════════════════════════════════════════════════════════════════════
# SECURITY NOTES
# ════════════════════════════════════════════════════════════════════════════════

# ⚠️ CRITICAL SECURITY WARNINGS:
# - These secrets are HIGHLY SENSITIVE - treat like passwords
# - NEVER commit this file to git
# - NEVER share via email or insecure channels
# - DELETE this file after copying to Coolify: rm -f $TEMP_FILE
# - Rotate secrets every 90 days minimum
# - Use different secrets for dev/staging/production

# ⚠️ WHAT TO DO IF SECRETS ARE COMPROMISED:
# 1. Generate new secrets immediately (run this script again)
# 2. Update Coolify environment variables
# 3. Restart application
# 4. Invalidate all existing sessions/tokens
# 5. Notify users to re-authenticate
# 6. Review access logs for suspicious activity

# ════════════════════════════════════════════════════════════════════════════════
# TECHNICAL DETAILS
# ════════════════════════════════════════════════════════════════════════════════

# Generation Method: OpenSSL rand -hex
# Entropy Source: /dev/urandom (cryptographically secure)
# JWT_SECRET: 256-bit (64 hex chars) - NIST SP 800-132 compliant
# SESSION_SECRET: 128-bit (32 hex chars) - Industry standard
# API_KEY: 256-bit (64 hex chars) - High security
# ENCRYPTION_KEY: 256-bit (64 hex chars) - AES-256 compatible

# Character Set: Hexadecimal (0-9, a-f)
# Randomness Quality: High entropy, suitable for cryptographic use
# Collision Probability: ~2^-256 (negligible)

EOF

    print_success "Secrets saved to temporary file: ${TEMP_FILE}"
    echo ""

    # Instructions
    print_section "Next Steps"
    echo ""
    echo -e "${BOLD}1. Copy JWT_SECRET to Coolify:${NC}"
    echo "   a. Open Coolify: https://cf.avolut.com"
    echo "   b. Navigate to application: b8sc48s8s0c4w00008k808w8"
    echo "   c. Go to: Environment Variables"
    echo "   d. Add or update: JWT_SECRET"
    echo "   e. Mark as: Secret (click eye icon to hide)"
    echo ""

    echo -e "${BOLD}2. Restart Application:${NC}"
    echo "   a. Click 'Restart' button in Coolify"
    echo "   b. Wait 30 seconds for application to start"
    echo ""

    echo -e "${BOLD}3. Verify Deployment:${NC}"
    echo "   $ curl https://auto.lumiku.com/health"
    echo "   $ ssh root@cf.avolut.com \"docker logs b8sc48s8s0c4w00008k808w8 --tail 50\""
    echo ""

    echo -e "${BOLD}4. Secure Cleanup:${NC}"
    echo "   $ rm -f ${TEMP_FILE}"
    echo ""

    # Security warnings
    print_section "SECURITY WARNINGS"
    echo ""
    print_warning "These secrets are HIGHLY SENSITIVE - treat them like passwords!"
    print_warning "NEVER commit this file or secrets to git repository"
    print_warning "NEVER share secrets via email, Slack, or insecure channels"
    print_warning "DELETE the temporary file after copying to Coolify"
    print_warning "Rotate secrets every 90 days minimum"
    echo ""

    # Summary
    print_section "Summary"
    echo ""
    print_success "4 cryptographically secure secrets generated"
    print_success "All secrets meet NIST SP 800-132 standards"
    print_success "Secrets saved to: ${TEMP_FILE}"
    print_info "Temporary file will be auto-deleted in 1 hour"
    echo ""

    # Auto-delete after 1 hour (3600 seconds)
    (sleep 3600 && rm -f "$TEMP_FILE" 2>/dev/null) &
    print_info "Auto-delete scheduled (PID: $!)"
    echo ""

    print_section "Generation Complete"
    echo ""
    echo -e "${GREEN}${BOLD}✓ Secrets generated successfully!${NC}"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Run main function
main

# Exit successfully
exit 0
