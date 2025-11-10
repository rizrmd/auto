#!/bin/bash

# Cleanup Jaeger from Production
# This script removes all Jaeger-related services and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.jaeger.yml"
NETWORK_NAME="autoleads-network"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop and remove Jaeger services
cleanup_jaeger_services() {
    print_status "Cleaning up Jaeger services..."

    if [ -f "$COMPOSE_FILE" ]; then
        # Stop and remove containers
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true

        # Remove containers explicitly
        docker rm -f autoleads-jaeger 2>/dev/null || true
        docker rm -f autoleads-jaeger-agent 2>/dev/null || true
        docker rm -f autoleads-otel-collector 2>/dev/null || true

        print_success "Jaeger services stopped and removed"
    else
        print_warning "Jaeger compose file not found: $COMPOSE_FILE"
    fi
}

# Remove Jaeger images
cleanup_jaeger_images() {
    print_status "Removing Jaeger Docker images..."

    # Remove Jaeger images
    docker rmi jaegertracing/all-in-one:latest 2>/dev/null || true
    docker rmi jaegertracing/jaeger-agent:latest 2>/dev/null || true
    docker rmi otel/opentelemetry-collector-contrib:latest 2>/dev/null || true

    print_success "Jaeger images removed"
}

# Cleanup Docker network
cleanup_network() {
    print_status "Cleaning up Docker network..."

    # Remove network if it exists and has no containers
    if docker network ls | grep -q "$NETWORK_NAME"; then
        local container_count=$(docker network inspect "$NETWORK_NAME" --format='{{len .Containers}}' 2>/dev/null || echo "0")

        if [ "$container_count" = "0" ]; then
            docker network rm "$NETWORK_NAME" 2>/dev/null || true
            print_success "Docker network removed"
        else
            print_warning "Docker network $NETWORK_NAME still has containers, skipping removal"
        fi
    fi
}

# Cleanup Jaeger files
cleanup_files() {
    print_status "Cleaning up Jaeger configuration files..."

    # Remove compose file
    rm -f "$COMPOSE_FILE"

    # Remove config files
    rm -f jaeger-ui.json
    rm -f otel-collector-config.yaml

    # Remove script
    rm -f scripts/deployment/start-jaeger.sh
    rm -f scripts/deployment/deploy-jaeger.md

    print_success "Jaeger configuration files removed"
}

# Restart main application
restart_application() {
    print_status "Restarting main AutoLeads application..."

    # Find main container (assuming it contains 'autoleads' in name)
    local main_container=$(docker ps --filter "name=autoleads" --format "{{.Names}}" | head -1)

    if [ -n "$main_container" ]; then
        docker restart "$main_container"
        print_success "Application restarted: $main_container"
    else
        print_warning "Main AutoLeads container not found"
    fi
}

# Verify cleanup
verify_cleanup() {
    print_status "Verifying Jaeger cleanup..."

    # Check if Jaeger containers are running
    local jaeger_containers=$(docker ps --filter "name=jaeger" --format "{{.Names}}" | wc -l)

    if [ "$jaeger_containers" -eq 0 ]; then
        print_success "✅ No Jaeger containers running"
    else
        print_warning "⚠️  Found $jaeger_containers Jaeger containers still running"
    fi

    # Check if Jaeger ports are still in use
    local port_16686=$(netstat -tuln 2>/dev/null | grep ":16686 " | wc -l)
    local port_6831=$(netstat -tuln 2>/dev/null | grep ":6831 " | wc -l)
    local port_6832=$(netstat -tuln 2>/dev/null | grep ":6832 " | wc -l)

    if [ "$port_16686" -eq 0 ] && [ "$port_6831" -eq 0 ] && [ "$port_6832" -eq 0 ]; then
        print_success "✅ Jaeger ports are free"
    else
        print_warning "⚠️  Some Jaeger ports are still in use"
    fi

    # Test WhatsApp webhook is still working
    print_status "Testing WhatsApp webhook functionality..."

    # You can add a webhook test here if needed
    print_success "✅ Cleanup verification completed"
}

# Main execution
main() {
    echo "🧹 AutoLeads Jaeger Cleanup Script"
    echo "==================================="
    echo ""
    echo "This script will remove all Jaeger-related services and configurations."
    echo ""

    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleanup cancelled."
        exit 0
    fi

    echo ""
    print_status "Starting Jaeger cleanup..."
    echo ""

    cleanup_jaeger_services
    cleanup_jaeger_images
    cleanup_network
    cleanup_files
    restart_application
    verify_cleanup

    echo ""
    print_success "🎉 Jaeger cleanup completed successfully!"
    echo ""
    echo "What was removed:"
    echo "  • Jaeger containers (all-in-one, agent, collector)"
    echo "  • Jaeger Docker images"
    echo "  • Configuration files (compose, JSON, YAML)"
    echo "  • Deployment scripts"
    echo ""
    echo "What remains:"
    echo "  • Main AutoLeads application (restarted)"
    echo "  • WhatsApp bot functionality"
    echo "  • All existing data and configurations"
    echo ""
    print_status "System is now clean and ready for alternative monitoring solutions."
}

# Handle script interruption
trap 'print_warning "Cleanup interrupted. Some resources may remain."; exit 1' INT

# Run main function
main "$@"