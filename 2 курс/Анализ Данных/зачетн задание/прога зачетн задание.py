import numpy as np
from scipy.stats import skew, kurtosis, norm
import matplotlib.pyplot as plt

# Данные оценок
grades = np.array([3, 5, 4, 3, 2, 3, 4, 5, 4, 3, 4, 5, 4, 5, 4, 4, 4, 4, 3, 2, 3, 4, 5, 5, 4, 3, 3, 3, 2, 5])

# Границы интервалов для оценок
bins = [1.5, 2.5, 3.5, 4.5, 5.5]

# Статистические параметры
mean_value = np.mean(grades)
variance = np.var(grades, ddof=1)
std_dev = np.sqrt(variance)
skewness = skew(grades)
excess_kurtosis = kurtosis(grades)
coefficient_of_variation = (std_dev / mean_value) * 100

# Вывод статистических параметров
print("Среднее значение:", mean_value)
print("Дисперсия:", variance)
print("Стандартное отклонение:", std_dev)
print("Асимметрия:", skewness)
print("Эксцесс:", excess_kurtosis)
print(f"Коэффициент вариации: {coefficient_of_variation:.2f}%")

# Гистограмма распределения оценок
plt.hist(grades, bins=bins, density=True, alpha=0.5, color='g', edgecolor='black', label='Интервальный вариационный ряд')

# Нормальное распределение на основе среднего и стандартного отклонения
x = np.linspace(min(bins), max(bins), 100)
y = norm.pdf(x, mean_value, std_dev)

# Отображение нормального распределения
plt.plot(x, y, 'r', label='Нормальное распределение')

# Настройка графика
plt.title('Распределение оценок и нормальное распределение')
plt.xlabel('Оценки')
plt.ylabel('Плотность вероятности')
plt.legend()
plt.grid(True)
plt.show()


