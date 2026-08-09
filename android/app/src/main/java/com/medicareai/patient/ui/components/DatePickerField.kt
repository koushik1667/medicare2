package com.medicareai.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.medicareai.patient.ui.theme.PrimaryBlue
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DatePickerField(
    label: String,
    selectedDate: String,
    onDateSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "选择日期"
) {
    var showDatePicker by remember { mutableStateOf(false) }
    
    // Parse existing date or use today
    val initialDate = remember(selectedDate) {
        try {
            if (selectedDate.isNotEmpty()) {
                LocalDate.parse(selectedDate, DateTimeFormatter.ISO_LOCAL_DATE)
            } else {
                LocalDate.now()
            }
        } catch (e: Exception) {
            LocalDate.now()
        }
    }
    
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = initialDate.toEpochDay() * 24 * 60 * 60 * 1000
    )
    
    Box(modifier = modifier) {
        OutlinedTextField(
            value = selectedDate,
            onValueChange = { },
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            leadingIcon = {
                Icon(Icons.Default.CalendarToday, null, tint = PrimaryBlue)
            },
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            singleLine = true,
            readOnly = true,
            trailingIcon = {
                IconButton(onClick = { showDatePicker = true }) {
                    Icon(Icons.Default.CalendarToday, null)
                }
            }
        )
    }
    
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val selectedLocalDate = LocalDate.ofEpochDay(millis / (24 * 60 * 60 * 1000))
                            val formattedDate = selectedLocalDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            onDateSelected(formattedDate)
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("确定", color = PrimaryBlue)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("取消")
                }
            }
        ) {
            DatePicker(
                state = datePickerState,
                showModeToggle = false
            )
        }
    }
}