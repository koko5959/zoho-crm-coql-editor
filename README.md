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
  - User module is not supported

## Requirements

- Zoho CRM account(Enterprise)
- widget hosting experience

## Setup

1. **Create a connection with the following scope**
   - ZohoCRM.modules.ALL
   - ZohoCRM.coql.READ
   - ZohoCRM.settings.ALL
2. **Download the codes**
   - Download the zip file("coqlHelper")
   - Upzip the file
3. **Configure "/app.js" file**
   - Set your data center domain in the `dcDomain` variable (e.g., "jp", "com", "eu")
   - Configure your connection name in the `connection` name created in #1
   - save the file
4. **Deploy the application**
   - Zip the folder "coqlHelper" again
   - Go to Zoho CRM and configure widget as follows
     -  Type: Web Tab
     -  Hosting: Zoho
     -  File: the zipped file
     -  Index Page: /widget.html (default)
     -  More detailed information
       - https://www.zoho.com/crm/developer/docs/widgets/usage.html
   -  Create web tab
     -  https://help.zoho.com/portal/en/kb/crm/customize-crm-account/customizing-modules/articles/web-tabs

## Usage

1. **Select a module** from the dropdown list
![image](https://github.com/user-attachments/assets/cf1c5364-358c-4f72-b7bd-60fa5f391ec2)

2. **Build your query** using the form-based interface:
   - Add fields to SELECT with optional aggregation functions and aliases
     - The fields shown in the pick list are in the module which are reached by two join from the base module
       - It is the restriction of COQL
       - User module is not supported
   - Create WHERE conditions with comparison operators
   - Define grouping and ordering as needed
   - Set pagination parameters
3. **Generate COQL** to convert your settings into a query
4. **Edit COQL manually** if you need to customize it further
5. **Execute the query**
![image](https://github.com/user-attachments/assets/2dab4da8-677a-4dc6-920c-f1b34a7eba11)


## Technical Implementation

- Built with React (using React hooks)
- Uses Zoho CRM API v7
- Implements connection APIs for secure API calls
- Recursively fetches related module fields
- React, Babel, and Bootstrap rely on CDN

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
-   https://www.zoho.com/crm/developer/docs/api/v7/COQL-Overview.html
- Inspired by the needs of Zoho CRM administrators and developers
