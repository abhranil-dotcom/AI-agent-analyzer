import logging
import sys


def configure_logging(debug: bool = True) -> None:
    """Configure root logging once at application startup."""
    level = logging.DEBUG if debug else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
        force=True,
    )

    # Quiet noisy third-party loggers in dev
    logging.getLogger("multipart").setLevel(logging.WARNING)
