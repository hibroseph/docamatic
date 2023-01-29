using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentMigrator;
using FluentMigrator.Postgres;

namespace Docamatic.Data.Migrations
{
    [Migration(1)]
    public class CreateBasicMetricTable : Migration
    {
        public override void Up()
        {
            Create.Table("basic_metrics")
            .WithColumn("id").AsInt32().NotNullable().PrimaryKey().Identity()
            .WithColumn("date_added").AsDateTimeOffset().NotNullable()
            .WithColumn("date").AsDateTimeOffset().NotNullable().Indexed()
            .WithColumn("event").AsString().NotNullable().Indexed()
            .WithColumn("data").AsString()
            .WithColumn("person").AsGuid().Indexed().NotNullable();
        }

        public override void Down()
        {
            Delete.Table("basic_metrics");
        }
    }
}