import pool from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    // Weekly workouts (last 7 days)
    const [weeklyWorkouts] = await pool.execute(
      `SELECT DATE_FORMAT(workout_date, '%d/%m') as day, 
              SUM(duration_minutes) as total_minutes,
              COUNT(*) as workout_count
       FROM WORKOUT 
       WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY workout_date 
       ORDER BY workout_date ASC`,
      [user_id]
    );

    // Today's nutrition
    const [todayMeals] = await pool.execute(
      `SELECT SUM(calories) as total_calories, 
              SUM(protein_g) as total_protein,
              SUM(carbs_g) as total_carbs,
              SUM(fat_g) as total_fat,
              COUNT(*) as meal_count
       FROM MEAL 
       WHERE user_id = ? AND meal_date = CURDATE()`,
      [user_id]
    );

    // Active goals with progress
    const [activeGoals] = await pool.execute(
      `SELECT goal_id, goal_type, target_value, current_value, status,
              ROUND((current_value / target_value) * 100, 1) as percent_complete
       FROM GOAL 
       WHERE user_id = ? AND status = 'Active'`,
      [user_id]
    );

    // Monthly workout count
    const [monthlyStats] = await pool.execute(
      `SELECT COUNT(*) as workouts_this_month, 
              SUM(calories_burned) as total_calories_burned
       FROM WORKOUT 
       WHERE user_id = ? AND MONTH(workout_date) = MONTH(CURDATE()) AND YEAR(workout_date) = YEAR(CURDATE())`,
      [user_id]
    );

    // User profile
    const [user] = await pool.execute(
      'SELECT first_name, last_name, height_cm FROM USER WHERE user_id = ?',
      [user_id]
    );

    res.json({
      user: user[0],
      weekly_workouts: weeklyWorkouts,
      today_nutrition: todayMeals[0] || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, meal_count: 0 },
      active_goals: activeGoals,
      monthly_stats: monthlyStats[0] || { workouts_this_month: 0, total_calories_burned: 0 }
    });
  } catch (err) {
    next(err);
  }
};