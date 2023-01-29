using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentMigrator;

namespace Docamatic.Data.Migrations
{
    [Migration(2)]
    public class ChangeColumnToDateOccurred : Migration
    {
        public override void Up()
        {
            Rename.Column("date").OnTable("basic_metrics").To("date_occurred");
        }

        public override void Down()
        {
            Rename.Column("date_occurred").OnTable("basic_metrics").To("date");
        }
    }
}