# Zoho CRM COQL Builder & DataTable

A user-friendly visual query builder for Zoho CRM's Object Query Language (COQL) with real-time data preview.


## Features

- **Visual COQL Query Builder**
  - SELECT fields with aggregator functions and aliases
  - WHERE conditions with logical operators
  - GROUP BY fields for aggregation
  - ORDER BY fields with sorting direction
  - Pagination controls
  
- **Direct COQL Editing**
  - Write custom COQL queries
  - Test queries independent of the builder
  
- **Instant Data Preview**
  - Execute queries and view results in a table
  - See record count and pagination status
  
- **Comprehensive Field Support**
  - Access standard and custom modules
  - Browse field hierarchy with lookup relationships
  - Navigate up to 2 levels of related module fields

## Requirements

- Zoho CRM account
- A connection to Zoho CRM API (widget connection in this case)

## Setup

1. **Configure your Zoho environment**
   - Set your data center domain in the `dcDomain` variable (e.g., "jp", "com", "eu")
   - Configure your connection name in the `connection` variable
   
2. **Deploy the application**
   - Upload the files to your web server or Zoho CRM widget
   - Ensure you have the necessary permissions and API access

## Usage

1. **Select a module** from the dropdown list
2. **Build your query** using the form-based interface:
   - Add fields to SELECT with optional aggregation functions and aliases
   - Create WHERE conditions with comparison operators
   - Define grouping and ordering as needed
   - Set pagination parameters
3. **Generate COQL** to convert your settings into a query
4. **Edit COQL manually** if you need to customize it further
5. **Execute the query** to view the results in the table

## Technical Implementation

- Built with React (using React hooks)
- Uses Zoho CRM API v7
- Implements connection APIs for secure API calls
- Recursively fetches related module fields

## Customization

You can modify this tool to meet your specific requirements:

- Adjust the `coqlModules` list to include/exclude specific modules
- Change the maximum recursion depth for field lookups
- Customize the UI components and styling
- Extend functionality with additional query options

## Limitations

- Maximum query limit of 2000 records
- Field lookup depth limited to 2 levels
- Subject to Zoho CRM API rate limits and restrictions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Acknowledgements

- Built using Zoho CRM's API
- Inspired by the needs of Zoho CRM administrators and developers
