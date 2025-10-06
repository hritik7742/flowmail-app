export async function GET() {
  try {
    // Create sample CSV data
    const csvContent = `name,email,tier
John Doe,john.doe@example.com,premium
Jane Smith,jane.smith@example.com,basic
Mike Johnson,mike.johnson@example.com,pro
Sarah Wilson,sarah.wilson@example.com,premium
David Brown,david.brown@example.com,basic
Lisa Davis,lisa.davis@example.com,pro
Tom Anderson,tom.anderson@example.com,premium
Emma Taylor,emma.taylor@example.com,basic
Chris Martin,chris.martin@example.com,pro
Amy White,amy.white@example.com,premium`

    // Return CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="flowmail-subscribers-sample.csv"'
      }
    })

  } catch (error) {
    console.error('Error generating sample file:', error)
    return Response.json({
      error: 'Failed to generate sample file',
      details: error.message
    }, { status: 500 })
  }
}