function now() {
    return new java.text.SimpleDateFormat("hh:mm:ss").format(new java.util.Date())
}

var dao = {};

(function(dao, load) {

    var DataSource = Packages.org.apache.commons.dbcp2.BasicDataSource;
    var Task = Packages.com.jarredweb.jesty.todos.Task;

    var Zjdbc = function() {
        this.config = {};
        this.config.properties = {
            "jdbc.driverClassName": "org.h2.Driver",
            "jdbc.url": "jdbc:h2:./data/todos.js_db;DB_CLOSE_DELAY=-1",
            "jdbc.username": "sa",
            "jdbc.password": "sa"
        };
        this.ds = undefined;
    };

    Zjdbc.prototype.initConfig = function(config) {
        this.config = config;
    };

    Zjdbc.prototype.getConfig = function() {
        return this.config;
    };

    Zjdbc.prototype.initDataSource = function(init) {
        var dataSource = new DataSource();
        dataSource.setDriverClassName(this.config.properties["jdbc.driverClassName"]);
        dataSource.setUrl(this.config.properties["jdbc.url"]);
        dataSource.setUsername(this.config.properties["jdbc.username"]);
        dataSource.setPassword(this.config.properties["jdbc.password"]);
        this.ds = dataSource;
    };

    Zjdbc.prototype.createTable = function(query, onSuccess, onError) {
        var con, stmt;
        try {
            con = this.ds.getConnection();
            stmt = con.createStatement();
            var result = stmt.execute(query);
            if (result) {
                onSuccess.call(this, "createTable was successful");
            }
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (stmt) stmt.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.insertBatch = function(tasks, onSuccess, onError) {
        var con, stmt;
        try {
            con = this.ds.getConnection();
            stmt = con.createStatement();
            for (var i = 0; i < tasks.length; i++) {
                stmt.addBatch(tasks[i]);
            }
            var result = stmt.executeBatch();
            onSuccess.call(this, result, "batch insert was successful");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (stmt) stmt.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.createTask = function(task, onSuccess, onError) {
        var query = "INSERT INTO tbl_todos (task) values (?)";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setString(1, task);
            var result = pst.executeUpdate();
            onSuccess.call(this, result, "createTask was successful");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.updateDone = function(task, done, onSuccess, onError) {
        var query = "UPDATE tbl_todos set completed=? where task = ?";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setBoolean(1, done);
            pst.setString(2, task);
            var result = pst.executeUpdate();
            onSuccess.call(this, result, "updated complete status");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.updateName = function(task, newName, onSuccess, onError) {
        var query = "UPDATE tbl_todos set task=? where task = ?";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setString(1, newName);
            pst.setString(2, task);
            var result = pst.executeUpdate();
            onSuccess.call(this, result, "updateName was successful");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.deleteTask = function(task, onSuccess, onError) {
        var query = "DELETE from tbl_todos where task = ?";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setString(1, task);
            var result = pst.executeUpdate();
            onSuccess.call(this, result, "deleteTask was successful");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.retrieveTask = function(name, onSuccess, onError) {
        var query = "SELECT * from tbl_todos where task = ?";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setString(1, name);
            var rs = pst.executeQuery();
            if (rs.next()) {
                var task = new Task();
                task.completed = rs.getBoolean("completed");
                task.name = rs.getString("task");
                task.created = rs.getDate("date_created");
                onSuccess.call(this, task, "retrieveTask was successful");
            } else {
                onSuccess.call(this, {}, "no task found");
            }
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.retrieveByRange = function(start, size, onSuccess, onError) {
        var query = "SELECT * from tbl_todos limit ? offset ?";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setInt(1, size);
            pst.setInt(2, start);
            var rs = pst.executeQuery();
            var result = [];
            while (rs.next()) {
                var task = new Task();
                task.completed = rs.getBoolean("completed");
                task.name = rs.getString("task");
                task.created = rs.getDate("date_created");
                result.push(task);
            }
            onSuccess.call(this, result, "retrieveByRange was successful");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    Zjdbc.prototype.retrieveByDone = function(completed, onSuccess, onError) {
        var query = "SELECT * from tbl_todos where completed = ?";
        var con, pst;
        try {
            con = this.ds.getConnection();
            pst = con.prepareStatement(query);
            pst.setBoolean(1, completed);
            var rs = pst.executeQuery();
            var result = [];
            while (rs.next()) {
                var task = new Task();
                task.completed = rs.getBoolean("completed");
                task.name = rs.getString("task");
                task.created = rs.getDate("date_created");
                result.push(task);
            }
            onSuccess.call(this, result, "retrieveTasks was successful");
        } catch (error) {
            onError.call(this, error.getMessage);
        } finally {
            if (pst) pst.close();
            if (con) con.close();
        }
    };

    //export Zjdbc through 'dao' 
    dao.Zjdbc = Zjdbc;

    //load data if necessary
    if (load) {
        function onCreate(msg) {
            print(msg);
        }

        //init database and insert data
        var zjdbc = new dao.Zjdbc();
        zjdbc.initDataSource();

        var data = [
            "merge into tbl_todos (task, completed) key(task) values ('buy milk', false);",
            "merge into tbl_todos (task, completed) key(task) values ('work out', true);",
            "merge into tbl_todos (task, completed) key(task) values ('watch game', false);",
            "merge into tbl_todos (task, completed) key(task) values ('hit gym', false);",
            "merge into tbl_todos (task, completed) key(task) values ('go to meeting', true);"
        ];

        zjdbc.createTable([
            "CREATE TABLE IF NOT EXISTS tbl_todos (",
            "  task varchar(25) UNIQUE NOT NULL,",
            "  completed boolean DEFAULT false,",
            "  date_created datetime default current_timestamp,",
            "  PRIMARY KEY (task)",
            ")"
        ].join(""), onCreate, onCreate);

        zjdbc.insertBatch(data, function(res, msg) { print("res=" + res + ", msg=" + msg); }, function(msg) { print(msg); });

        print("data loaded".concat(" @ ").concat(new Date().toString()));
    }

})(dao, false);