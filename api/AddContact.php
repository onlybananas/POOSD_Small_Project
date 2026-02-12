
<?php

// API: Add Contact
// Purpose: Accepts JSON input to create a new contact for a user.
// Expected JSON fields: firstName, lastName, email, phone, userId
// Returns JSON: { success: true|false, error: "" | message, contactId: id }

	$inData = getRequestInfo();

	$firstName = $inData["firstName"];
	$lastName = $inData["lastName"];
	$email = $inData["email"];
	$phone = $inData["phone"];
	$userId = $inData["userId"];

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "cop4331");
	if ($conn->connect_error) 
	{
		returnWithError($conn->connect_error);
	} 
	else
	{
		// Prepare and execute parameterized INSERT to prevent SQL injection
		$stmt = $conn->prepare("INSERT into Contacts (FirstName, LastName, Email, Phone, UserID) VALUES (?, ?, ?, ?, ?)");
		$stmt->bind_param("ssssi", $firstName, $lastName, $email, $phone, $userId);
		$stmt->execute();

		$contactId = $stmt->insert_id;

		$stmt->close();
		$conn->close();

		returnWithSuccess($contactId);
	}

	// Read JSON request body and decode into associative array
	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

	// Send a JSON string as the response
	function sendResultInfoAsJson($obj)
	{
		header('Content-type: application/json');
		echo $obj;
	}
	
	// Helper to return an error response
	function returnWithError($err)
	{
		$retValue = '{"success":false,"error":"' . $err . '"}';
		sendResultInfoAsJson($retValue);
	}

	// Helper to return a success response including the new contact id
	function returnWithSuccess($contactId)
	{
		$retValue = '{"success":true,"error":"","contactId":' . $contactId . '}';
		sendResultInfoAsJson($retValue);
	}
?>
