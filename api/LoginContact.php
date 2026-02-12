<?php

// API: Login
// Purpose: Authenticate a user. Expects JSON with login and password.
// Returns JSON: { id: userId, firstName: "", lastName: "", error: "" }

	$inData = getRequestInfo();
	
	$id = 0;
	$firstName = "";
	$lastName = "";

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "cop4331");
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// Check missing/empty inputs
		if( !isset($inData["login"]) || !isset($inData["password"]) || 
		    empty(trim($inData["login"])) || empty(trim($inData["password"])) )
		{
			returnWithError("All fields are required");
		}
		else
		{
			// Minimal plaintext check: find matching login+password
			$stmt = $conn->prepare("SELECT ID, firstName, lastName FROM Users WHERE Login=? AND Password=?");
			$stmt->bind_param("ss", $inData["login"], $inData["password"]);
			$stmt->execute();
			$result = $stmt->get_result();

			if( $row = $result->fetch_assoc() )
			{
				// Successful authentication
				returnWithInfo( $row['firstName'], $row['lastName'], $row['ID'] );
			}
			else
			{
				// Authentication failed
				returnWithError("Invalid username or password");
			}

			$stmt->close();
		}
		
		$conn->close();
	}
	
	// Function to decode JSON input from request body
	function getRequestInfo()
	{
		$input = file_get_contents('php://input');
		$decoded = json_decode($input, true);
		
		if (json_last_error() !== JSON_ERROR_NONE) {
			return [];
		}
		
		return $decoded ? $decoded : [];
	}

	// Function to send JSON response with proper content type header
	function sendResultInfoAsJson( $obj )
	{
		// Set response content type to JSON
		header('Content-type: application/json');
		// Output the JSON string
		echo $obj;
	}
	
	// Function to format and send error response
	function returnWithError( $err )
	{
		// Create JSON error response with empty user data and error message
		$retValue = '{"id":0,"firstName":"","lastName":"","error":"' . $err . '"}';
		// Send the formatted JSON response
		sendResultInfoAsJson( $retValue );
	}
	
	// Function to format and send successful response with user data
	function returnWithInfo( $firstName, $lastName, $id )
	{
		// Create JSON success response with user data and empty error field
		$retValue = '{"id":' . $id . ',"firstName":"' . $firstName . '","lastName":"' . $lastName . '","error":""}';
		// Send the formatted JSON response
		sendResultInfoAsJson( $retValue );
	}
	
?>