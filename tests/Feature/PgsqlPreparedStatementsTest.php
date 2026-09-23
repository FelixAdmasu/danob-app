<?php

namespace Tests\Feature;

use Pdo\Pgsql;
use Tests\TestCase;

class PgsqlPreparedStatementsTest extends TestCase
{
    /**
     * Server-side named prepared statements are incompatible with
     * transaction-mode connection poolers: the backend that parsed the
     * statement may differ from the one that executes it (SQLSTATE 26000
     * "prepared statement ... does not exist" on Supabase's PgBouncer).
     */
    public function test_pgsql_connection_disables_server_side_prepared_statements(): void
    {
        if (! defined(Pgsql::class.'::ATTR_DISABLE_PREPARES')) {
            $this->markTestSkipped('The pdo_pgsql extension (PHP >= 8.4) is not available.');
        }

        $options = config('database.connections.pgsql.options');

        $this->assertIsArray($options);
        $this->assertArrayHasKey(constant(Pgsql::class.'::ATTR_DISABLE_PREPARES'), $options);
        $this->assertTrue($options[constant(Pgsql::class.'::ATTR_DISABLE_PREPARES')]);
    }
}
