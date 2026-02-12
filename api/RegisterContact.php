<?php

// API: Register User
// Purpose: Register a new user account. Expects JSON with firstName, lastName, login, password.
// Returns JSON: { id: userId, firstName: "", lastName: "", error: "" }

	$inData = getRequestInfo();
	
	$firstName = "";
	$lastName = "";
	$login = "";
	$password = "";
	
	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "cop4331");
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// ADDED: Check for missing/empty inputs first
		if( !isset($inData["firstName"]) || !isset($inData["lastName"]) || 
		    !isset($inData["login"]) || !isset($inData["password"]) ||
		    empty(trim($inData["firstName"])) || empty(trim($inData["lastName"])) ||
		    empty(trim($inData["login"])) || empty(trim($inData["password"])) )
		{
			returnWithError("All fields are required");
		}
		else
		{
			// Check if username already exists
			$checkStmt = $conn->prepare("SELECT ID FROM Users WHERE Login=?");
			$checkStmt->bind_param("s", $inData["login"]);
			$checkStmt->execute();
			$checkResult = $checkStmt->get_result();
		
			if( $checkResult->num_rows > 0 )
			{
				// Username conflict
				returnWithError("Username already exists");
			}
			else
			{
				// Insert new user (note: storing password as provided, minimal implementation)
				$stmt = $conn->prepare("INSERT INTO Users (firstName, lastName, Login, Password) VALUES (?, ?, ?, ?)");
				$stmt->bind_param("ssss", $inData["firstName"], $inData["lastName"], $inData["login"], $inData["password"]);
			
				if( $stmt->execute() )
				{
					$newUserId = $conn->insert_id;
					returnWithInfo( $inData["firstName"], $inData["lastName"], $newUserId );
				}
				else
				{
					returnWithError("Registration failed. Please try again.");
				}
			
				$stmt->close();
			}
			
			$checkStmt->close();
		}
		
		$conn->close();
	}
	
	// Function to decode JSON input from request body
	function getRequestInfo()
	{
		// Read raw input from php://input stream and decode JSON to associative array
		$input = file_get_contents('php://input');
		$decoded = json_decode($input, true);
		
		// Check for JSON decode errors
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