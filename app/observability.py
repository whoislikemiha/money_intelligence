"""Phoenix observability setup for LangGraph agents"""

import logging
from typing import Optional
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, BatchSpanProcessor

from app.config import settings

logger = logging.getLogger(__name__)

_tracer_provider: Optional[TracerProvider] = None
_instrumentor = None


def init_phoenix() -> Optional[TracerProvider]:
    """
    Initialize Phoenix observability for LangGraph agents.

    This sets up automatic instrumentation for both the Transaction Parser
    and Financial Assistant agents using OpenTelemetry.

    Returns:
        TracerProvider if initialization succeeds, None otherwise
    """
    global _tracer_provider

    if not settings.PHOENIX_ENABLED:
        logger.info("Phoenix observability is disabled")
        return None

    if _tracer_provider is not None:
        logger.info("Phoenix already initialized")
        return _tracer_provider

    try:
        from phoenix.otel import register
        from openinference.instrumentation.langchain import LangChainInstrumentor

        # Construct Phoenix endpoint - must include /v1/traces for OTLP HTTP
        phoenix_endpoint = f"http://{settings.PHOENIX_HOST}:{settings.PHOENIX_PORT}/v1/traces"

        logger.info(f"Initializing Phoenix observability at {phoenix_endpoint}")

        # Register Phoenix tracer provider with correct endpoint
        _tracer_provider = register(
            project_name=settings.PHOENIX_PROJECT_NAME,
            endpoint=phoenix_endpoint,
        )

        # Manually instrument LangChain/LangGraph with skip_dep_check to avoid version issues
        LangChainInstrumentor().instrument(
            tracer_provider=_tracer_provider,
            skip_dep_check=True  # Skip dependency version checks
        )

        logger.info(
            f"✓ Phoenix observability enabled for project '{settings.PHOENIX_PROJECT_NAME}'"
        )
        logger.info(f"  View traces at: http://{settings.PHOENIX_HOST}:{settings.PHOENIX_PORT}")

        return _tracer_provider

    except ImportError as e:
        logger.warning(
            "Phoenix dependencies not installed. "
            "Run: pip install arize-phoenix openinference-instrumentation-langchain"
        )
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Phoenix: {e}", exc_info=True)
        return None


def shutdown_phoenix():
    """Gracefully shutdown Phoenix tracer"""
    global _tracer_provider

    if _tracer_provider is not None:
        try:
            # Force flush any pending traces
            _tracer_provider.force_flush()
            logger.info("Phoenix tracer shutdown successfully")
        except Exception as e:
            logger.error(f"Error shutting down Phoenix: {e}")
        finally:
            _tracer_provider = None
