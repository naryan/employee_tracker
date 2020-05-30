//Dependencies
const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "companyDB"
});
connection.connect(function(err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  startTracker();
});

const questions = [
  {
    name: "what_to_do",
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View All Employees",
      "View Departments",
      "View Roles",
      "Add Employee",
      "Add a Role",
      "Add a Department",
      "Exit"
    ]
  }
];

function startTracker() {
  inquirer
    .prompt(questions)
    .then(function(res, err) {
      if (err) throw err;
      switch (res.what_to_do) {
        case "View Departments":
          viewDepartments();
          break;
        case "View Roles":
          viewRoles();
          break;
        case "View All Employees":
          viewAllEmployees();
          break;
        case "Add Employee":
          addEmployee();
          break;
        case "Add a Department":
          addDepartments();
          break;
        case "Add a Role":
          addRoles();
          break;
        case "Exit":
          connection.end();
          break;
        default:
          console.log("Error Occured");
          break;
      }
    })
    .catch(function(err, res) {
      console.log(err);
    });
}

function viewAllEmployees() {
  connection.query(
    "SELECT first_name as 'First Name' , last_name as 'Last Name', title as 'Title', salary as 'Salary' FROM employee LEFT JOIN role ON employee.role_id = role.id;",
    function(err, res) {
      if (err) throw err;
      console.table(res);
      return startTracker();
    }
  );
}

function viewDepartments() {
  connection.query("SELECT * FROM department", function(err, res) {
    if (err) throw err;
    console.table(res);
    startTracker();
  });
}

function viewRoles() {
  connection.query("SELECT * FROM role", function(err, res) {
    if (err) throw err;
    console.table(res);
    startTracker();
  });
}

function addEmployee() {
  connection.query("SELECT * FROM employee", function(err, managerResult) {
    if (err) throw err;
    let managersList;

    managersList = managerResult.map(function(manager) {
      return manager.first_name + " " + manager.last_name;
    });

    if (managerResult.length === 0) {
      managersList = [0];
    }

    connection.query("SELECT * FROM role", function(err, roleResult) {
      if (err) throw err;

      if (roleResult.length === 0) {
        console.log("You need to enter a role first.");
        return startTracker();
      }

      let rolesList = roleResult.map(function(role) {
        return role.title;
      });

      const employeeQuestions = [
        {
          name: "first_name",
          type: "input",
          message: "Enter Employee First Name: "
        },
        {
          name: "last_name",
          type: "input",
          message: "Enter Employee Last Name: "
        },
        {
          name: "role",
          type: "list",
          choices: rolesList
        },
        {
          name: "manager",
          type: "list",
          choices: managersList
        }
      ];

      inquirer
        .prompt(employeeQuestions)
        .then(function(employeeQuestionsResult) {
          let roleID;
          for (i = 0; i < roleResult.length; i++) {
            if (employeeQuestionsResult.role === roleResult[i].title) {
              roleID = roleResult[i].id;
              break;
            }
          }

          let managerID;
          for (i = 0; i < managerResult.length; i++) {
            if (employeeQuestionsResult.manager === managerResult[i].title) {
              managerID = managerResult[i].id;
              break;
            }
          }

          connection.query(
            "INSERT INTO employee SET ?",
            {
              first_name: employeeQuestionsResult.first_name,
              last_name: employeeQuestionsResult.last_name,
              role_id: roleID,
              manager_id: managerID
            },

            function(err, res) {
              if (err) throw err;
              console.table(res);
              startTracker();
            }
          );
        });
    });
  });
}

//add departments function
function addDepartments() {
  const departmentQuestions = [
    {
      name: "department_name",
      type: "input",
      message: "Enter Department Name: "
    }
  ];

  inquirer
    .prompt(departmentQuestions)
    .then(function(res) {
      connection.query(
        "INSERT INTO department SET ?",
        { name: res.department_name },
        function(err, res) {
          if (err) throw err;
          viewDepartments();
          startTracker();
        }
      );
    })
    .catch(function(err) {
      console.log("Error Occurred");
      console.log(err);
    });
}

function addRoles() {
  connection.query("SELECT * FROM department", function(err, departmentResult) {
    if (err) throw err;
    console.log(departmentResult);
    let departmentList = departmentResult.map(function(department) {
      return department.name;
    });

    const rolesQuestions = [
      {
        name: "role_title",
        type: "input",
        message: "Enter Role Title: "
      },
      {
        name: "role_salary",
        type: "input",
        message: "Enter Salary: "
      },
      {
        name: "role_department",
        type: "list",
        choices: departmentList
      }
    ];

    if (departmentResult.length === 0) {
      console.log("You need to enter a department first.");
      return startTracker();
    }

    inquirer.prompt(rolesQuestions).then(function(roleQuestionsResult) {
      console.log(roleQuestionsResult);
      console.log(departmentResult);

      let departmentID;

      for (i = 0; i < departmentResult.length; i++) {
        if (roleQuestionsResult.role_department === departmentResult[i].name) {
          departmentID = departmentResult[i].id;
          break;
        }
      }
      console.log(departmentID);

      connection
        .query(
          "INSERT INTO role SET ?",
          {
            title: roleQuestionsResult.role_title,
            department_id: departmentID,
            salary: roleQuestionsResult.role_salary
          },
          function(err, res) {
            if (err) throw err;
            console.table(res);
            startTracker();
          }
        )
        .catch(function(err) {
          console.log(err);
        });
    });
  });
}
