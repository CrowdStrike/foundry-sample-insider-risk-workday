"""Function to retrieve linked Active Directory accounts for Falcon Identity Protection entities."""
import json
import uuid

from crowdstrike.foundry.function import Function, Request, Response, APIError
from falconpy import IdentityProtection

FUNC = Function.instance()


@FUNC.handler(method="GET", path="/linked-accounts")
def get_linked_accounts(request: Request) -> Response:
    """Retrieve linked AD accounts for a given entityID.

    Args:
        request: Request object containing EntityId in body

    Returns:
        Response object with linked entities or error
    """
    try:
        # Getting input variables
        entity_id = request.body.get("EntityId")
        # Validate entity_id is provided and is a valid UUID to prevent injection
        if not entity_id:
            return Response(
                code=400,
                errors=[APIError(code=400, message="EntityId is required")]
            )
        try:
            # Validate UUID format - this prevents injection attacks
            uuid.UUID(str(entity_id))
        except (ValueError, TypeError):
            return Response(
                code=400,
                errors=[APIError(code=400, message="EntityId must be a valid UUID format")]
            )

        # Initialize client without explicit authentication parameters
        falcon = IdentityProtection()

        idp_query = """query ($entityId: UUID!) {
  entities(associationQuery: {bindingTypes: [LINKED_ACCOUNT], entityQuery: {entityIds: [$entityId]}}, first: 100) {
    nodes {
      entityId
      accounts {
        ... on ActiveDirectoryAccountDescriptor {
          objectSid
          domain
        }
      }
    }
  }
}
"""
        # Use proper JSON serialization with validated UUID to prevent injection
        variables = json.dumps({"entityId": str(entity_id)})

        response = falcon.graphql(query=idp_query, variables=variables)
        if response.get("status_code") != 200:
            return Response(
                code=response.get("status_code"),
                errors=[
                    APIError(
                        code=response.get("status_code"),
                        message=response.get("body").get("errors")[0].get("message")
                    )
                ],
            )

        entities = response.get("body").get("data").get("entities").get("nodes")

        linked_entities = []
        for entity in entities:
            for account in entity.get("accounts"):
                linked_entity = {
                    "EntitySid": account.get("objectSid"),
                    "EntityId": entity.get("entityId"),
                    "Domain": account.get("domain")
                }
                linked_entities.append(linked_entity)

        # Prepare response body
        body = {
            "linked_entities": linked_entities
        }

        return Response(
            body=body,
            code=200,
        )

    except Exception as e:  # pylint: disable=broad-except
        return Response(
            code=500,
            errors=[APIError(code=500, message=f"Internal server error: {str(e)}")],
        )


if __name__ == "__main__":
    FUNC.run()
