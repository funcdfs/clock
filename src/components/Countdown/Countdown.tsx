import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './Countdown.css';

interface CountdownData {
  targetDate: string;
  timeLeft: {
    days: number;
    total: number;
  } | null;
}

export interface CountdownRef {
  clearData: () => void;
}

const Countdown = forwardRef<CountdownRef>((_, ref) => {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; total: number } | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 暴露清除方法给父组件
  useImperativeHandle(ref, () => ({
    clearData: handleClear
  }));

  // 从本地存储加载数据
  useEffect(() => {
    const savedData = localStorage.getItem('countdownData');
    if (savedData) {
      const data: CountdownData = JSON.parse(savedData);
      if (data.targetDate) {
        setSelectedDate(data.targetDate);
        const newTargetDate = new Date(data.targetDate);
        newTargetDate.setHours(23, 59, 59, 999);
        setTargetDate(newTargetDate);
        if (data.timeLeft) {
          setTimeLeft(data.timeLeft);
        }
      }
    }
  }, []);

  // 保存数据到本地存储
  const saveToLocalStorage = (date: string, timeLeftData: { days: number; total: number } | null) => {
    const data: CountdownData = {
      targetDate: date,
      timeLeft: timeLeftData
    };
    localStorage.setItem('countdownData', JSON.stringify(data));
  };

  const calculateTimeLeft = (target: Date) => {
    const now = new Date();
    const difference = target.getTime() - now.getTime();
    return {
      days: Math.ceil(difference / (1000 * 60 * 60 * 24)),
      total: difference
    };
  };

  useEffect(() => {
    if (targetDate) {
      const timer = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(targetDate);
        if (newTimeLeft.total <= 0) {
          handleClear();
        } else {
          setTimeLeft(newTimeLeft);
          // 保存更新后的时间
          saveToLocalStorage(selectedDate, newTimeLeft);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [targetDate, selectedDate]);

  const handleClear = () => {
    setTimeLeft(null);
    setTargetDate(null);
    setSelectedDate('');
    // 清除本地存储
    localStorage.removeItem('countdownData');
  };

  const handleStartCountdown = () => {
    if (timeLeft) {
      handleClear();
      return;
    }

    if (!selectedDate) {
      dateInputRef.current?.showPicker();
      return;
    }
    const newTargetDate = new Date(selectedDate);
    newTargetDate.setHours(23, 59, 59, 999);
    setTargetDate(newTargetDate);
    const newTimeLeft = calculateTimeLeft(newTargetDate);
    setTimeLeft(newTimeLeft);
    // 保存新的倒计时数据
    saveToLocalStorage(selectedDate, newTimeLeft);
  };

  return (
    <div className="countdown-container">
      <div className="countdown-header">
        <h3>倒数日</h3>
        <div className="countdown-input-group">
          <input 
            ref={dateInputRef}
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            placeholder="选择日期"
            disabled={timeLeft !== null}
          />
          <button 
            className={`countdown-btn ${timeLeft ? 'clear' : ''}`}
            onClick={handleStartCountdown}
            title={timeLeft ? '清除' : '开始倒数'}
          >
            {timeLeft ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {timeLeft && (
        <div className="countdown-display">
          <div className={`countdown-circle ${timeLeft.days <= 7 ? 'ending' : ''}`}>
            <span className="countdown-number">
              {timeLeft.days}
            </span>
            <span className="countdown-label">
              天
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

Countdown.displayName = 'Countdown';

export default Countdown; 