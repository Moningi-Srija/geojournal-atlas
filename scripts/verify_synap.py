"""Run a safe standalone Maximem Synap memory proof for GeoJournal.

This script intentionally stays outside the browser app. It expects a
server-side ``SYNAP_API_KEY`` environment variable and writes only a synthetic
demo preference, never a real user's travel history.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from typing import Any

from maximem_synap import MaximemSynapSDK
from maximem_synap.memories import IngestStatus


DEMO_USER_ID = "geojournal-crackathon-demo"
DEMO_DOCUMENT_ID = "geojournal-crackathon-proof-2026-07-18"
DEMO_DOCUMENT = (
    "User: I enjoy quiet mountain trails, independent coffee shops, "
    "and short weekend trips from Bengaluru. I prefer moderate budgets "
    "and would rather avoid crowded nightlife.\n"
    "Assistant: I will remember those travel preferences for future planning."
)


def proof_payload() -> dict[str, Any]:
    """Return the only payload this proof is permitted to send."""
    return {
        "document": DEMO_DOCUMENT,
        "document_type": "ai-chat-conversation",
        "document_id": DEMO_DOCUMENT_ID,
        "user_id": DEMO_USER_ID,
        "mode": "long-range",
        "metadata": {
            "source": "geojournal-crackathon-verification",
            "synthetic": True,
        },
    }


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verify GeoJournal's server-side Synap memory path with synthetic data."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and print the synthetic request contract without using a key or network.",
    )
    args = parser.parse_args()

    payload = proof_payload()
    if args.dry_run:
        print(json.dumps({
            "dry_run": True,
            "network_request": False,
            "uses_synthetic_data_only": payload["metadata"]["synthetic"],
            "api_key_source": "SYNAP_API_KEY environment variable (not read in dry-run)",
            "request": payload,
        }, indent=2))
        return

    if not os.environ.get("SYNAP_API_KEY"):
        raise SystemExit("SYNAP_API_KEY is required and must remain outside the repository.")

    sdk = MaximemSynapSDK(_force_new=True)
    await sdk.initialize()

    try:
        ingestion = await sdk.memories.create(**payload)
        status = await sdk.memories.wait_for_completion(
            ingestion.ingestion_id,
            timeout_seconds=120,
            poll_interval_seconds=2,
        )
        if status.status not in (IngestStatus.COMPLETED, IngestStatus.PARTIAL_SUCCESS):
            raise SystemExit(
                f"Synap ingestion did not complete successfully (status={status.status.value})."
            )

        context = await sdk.user.context.fetch(
            user_id=DEMO_USER_ID,
            search_query=["What kind of weekend trip would this traveler enjoy?"],
            max_results=10,
            mode="accurate",
        )

        counts = {
            name: len(getattr(context, name, []) or [])
            for name in ("facts", "preferences", "episodes")
        }
        if sum(counts.values()) == 0:
            raise SystemExit(
                "Synap ingestion completed, but scoped retrieval returned no travel context."
            )

        print(json.dumps({
            "instance_id": sdk.instance_id,
            "ingestion_status": str(status.status.value),
            "memories_created": status.memories_created,
            "retrieved": counts,
            "proof": "Synap ingestion and scoped retrieval completed with synthetic travel data.",
        }, indent=2))
    finally:
        await sdk.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
