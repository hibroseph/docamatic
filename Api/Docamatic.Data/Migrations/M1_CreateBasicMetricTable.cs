using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentMigrator;
using FluentMigrator.Postgres;

namespace Docamatic.Data.Migrations
{
    [Migration(1)]
    public class M1_CreateBasicMetricTable : Migration
    {
        public override void Up()
        {
            Create.Table("basic_metrics")
            .WithColumn("id").AsInt32().NotNullable().PrimaryKey().Identity()
            .WithColumn("date_occurred").AsDateTimeOffset().NotNullable().Indexed()
            .WithColumn("date_created").AsDateTimeOffset().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn("event").AsString().NotNullable().Indexed()
            .WithColumn("data").AsString().Nullable()
            .WithColumn("person").AsGuid().Indexed().NotNullable();
        }

        public override void Down()
        {
            Delete.Table("basic_metrics");
        }
    }
}