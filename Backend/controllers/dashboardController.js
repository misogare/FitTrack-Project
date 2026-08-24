import pool from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    const [
      [weeklyWorkouts],
      [todayMeals],
      [activeGoals],
      [monthlyStats],
      [user],
      [recentWorkouts],
      [recentMeals],
      [settings],
      [todaySummary]
    ] = await Promise.all([
      // 1) Weekly workouts (last 7 days)
      pool.execute(
        `SELECT DATE_FORMAT(workout_date, '%d/%m') AS day,
                COALESCE(SUM(duration_minutes), 0) AS total_minutes,
                COUNT(*) AS workout_count
         FROM WORKOUT
         WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY workout_date
         ORDER BY workout_date ASC`,
        [user_id]
      ),

      // 2) Today's nutrition
      pool.execute(
        `SELECT COALESCE(SUM(calories), 0)   AS total_calories,
                COALESCE(SUM(protein_g), 0)  AS total_protein,
                COALESCE(SUM(carbs_g), 0)    AS total_carbs,
                COALESCE(SUM(fat_g), 0)       AS total_fat,
                COUNT(*)                     AS meal_count
         FROM MEAL
         WHERE user_id = ? AND meal_date = CURDATE()`,
        [user_id]
      ),

      // 3) Active goals with progress
      pool.execute(
        `SELECT goal_id, goal_type, target_value, current_value, status,
                ROUND((current_value / target_value) * 100, 1) AS percent_complete
         FROM GOAL
         WHERE user_id = ? AND status = 'Active'
         ORDER BY created_at DESC`,
        [user_id]
      ),

      // 4) Monthly workout stats
      pool.execute(
        `SELECT COUNT(*)                              AS workouts_this_month,
                COALESCE(SUM(calories_burned), 0)     AS total_calories_burned,
                COALESCE(SUM(duration_minutes), 0)    AS total_minutes_this_month,
                COALESCE(SUM(distance_km), 0)         AS total_distance_km
         FROM WORKOUT
         WHERE user_id = ?
           AND MONTH(workout_date) = MONTH(CURDATE())
           AND YEAR(workout_date)  = YEAR(CURDATE())`,
        [user_id]
      ),

      // 5) User profile
      pool.execute(
        'SELECT first_name, last_name, height_cm FROM USER WHERE user_id = ?',
        [user_id]
      ),

      // 6) Recent workouts — NEW
      pool.execute(
        `SELECT workout_id, activity_name, workout_type,
                duration_minutes, calories_burned, intensity,
                DATE_FORMAT(workout_date, '%Y-%m-%d') AS workout_date
         FROM WORKOUT
         WHERE user_id = ?
         ORDER BY workout_date DESC, created_at DESC
         LIMIT 5`,
        [user_id]
      ),

      // 7) Recent meals — NEW
      pool.execute(
        `SELECT meal_id, meal_type, food_name, calories,
                DATE_FORMAT(meal_date, '%Y-%m-%d') AS meal_date
         FROM MEAL
         WHERE user_id = ?
         ORDER BY meal_date DESC, created_at DESC
         LIMIT 5`,
        [user_id]
      ),

      // 8) User settings — NEW (targets for KPI cards)
      pool.execute(
        `SELECT
           COALESCE(daily_step_goal, 10000)         AS daily_step_goal,
           COALESCE(daily_workout_minutes, 60)      AS daily_workout_minutes,
           COALESCE(daily_calorie_burn_goal, 500)   AS daily_calorie_burn_goal,
           COALESCE(daily_hydration_litres, 2.50)   AS daily_hydration_litres
         FROM SETTINGS
         WHERE user_id = ?`,
        [user_id]
      ),

      // 9) Today's workout summary — NEW
      pool.execute(
        `SELECT
           COALESCE(SUM(duration_minutes), 0)  AS minutes_today,
           COALESCE(SUM(calories_burned), 0)   AS calories_today,
           COUNT(*)                            AS sessions_today
         FROM WORKOUT
         WHERE user_id = ? AND workout_date = CURDATE()`,
        [user_id]
      )
    ]);

    res.json({
      user: user[0] || {},
      weekly_workouts: weeklyWorkouts,
      today_nutrition: todayMeals[0] || {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        meal_count: 0,
      },
      active_goals: activeGoals,
      monthly_stats: monthlyStats[0] || {
        workouts_this_month: 0,
        total_calories_burned: 0,
        total_minutes_this_month: 0,
        total_distance_km: 0,
      },
      recent_workouts: recentWorkouts,
      recent_meals: recentMeals,
      settings: settings[0] || {
        daily_step_goal: 10000,
        daily_workout_minutes: 60,
        daily_calorie_burn_goal: 500,
        daily_hydration_litres: 2.5,
      },
      today_summary: todaySummary[0] || {
        minutes_today: 0,
        calories_today: 0,
        sessions_today: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};